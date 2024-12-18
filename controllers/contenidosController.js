const { Contenido } = require("../models/contenido.js");
const { Genero } = require("../models/genero");
const { Actor } = require("../models/actor");
const { ContenidoActores } = require("../models/contenidoActores");
const { Categoria } = require("../models/categoria.js")
const { Op } = require("sequelize");
const {formateadorResponse, formateadorObjeto} = require("../handlers/formateador.js");

// Filtrar contenido
const filtrarContenido = async (req, res) => {
    try {
        const { genero, titulo, categoria } = req.query;

        const filterOptions = {
            include: [
            {
                model: Categoria,
                attributes: ['nombre_categoria'],
                where: categoria ? { nombre_categoria: { [Op.like]: `%${categoria}%` } } : {}
            },
            {
                model: Genero,
                where: genero ? { nombre_genero: { [Op.like]: `%${genero}%` } } : {}
            },
            {
                model: Actor,
                through: {
                    model: ContenidoActores
                },
                attributes: ['nombre_actor']
            }
        ]
        };

    if (titulo) {
        filterOptions.where = { titulo: { [Op.like]: `%${titulo}%` } };
    }  
    const contenidos = await Contenido.findAll(filterOptions);

    if (contenidos.length > 0) {
        return res.json(formateadorResponse(contenidos));
    } else {
        return res.status(404).json({ msg: 'No se encontraron resultados con esos filtros.' });
    }
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

// Obtener todos los contenidos
const obtenerContenidos = async (req, res) => {
    try {
        const contenidos = await Contenido.findAll({
            attributes:['id_contenido','titulo','resumen','temporadas','duracion','trailer'],
            include: [
                {
                    model: Categoria,
                    attributes: ['nombre_categoria']
                },
                {
                    model: Genero,
                    attributes: ['nombre_genero']
                },
                {
                    model: Actor,
                    through:{
                        model: ContenidoActores,
                        attributes:[]
                    },
                    attributes:['nombre_actor'],
                    as:['actor']
                }
            ]
    });
    res.json(formateadorResponse(contenidos));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los contenidos.' });
    }
};

// Obtener contenido por ID
const obtenerPorId = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id || id < 1) return res.status(400).json({ msg: 'El id es inválido' });

        const contenido = await Contenido.findByPk(id, {
            attributes: ['id_contenido', 'titulo', 'resumen', 'temporadas', 'duracion', 'trailer'],
            include: [
                {
                    model: Categoria,
                    attributes: ['nombre_categoria']
                },
                {
                    model: Genero,
                    attributes: ['nombre_genero']
                },
                {
                    model: Actor,
                    through: {
                        model: ContenidoActores,
                        attributes: []
                    },
                    attributes: ['nombre_actor']
                }
            ]
        });

        if (!contenido) {
            return res.status(404).json({ error: 'Contenido no encontrado.' });
        }

        res.status(200).json(formateadorObjeto(contenido));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el contenido.', details: error.message });
    }
};

//Eliminar contenido por ID
const eliminarContenido = async(req,res)=>{
    try{
        const {id} = req.params;
        if(id > 0 && !undefined){
            const contenido = await Contenido.findByPk(id);
            if(!contenido) res.status(404).json({msg:'Contenido no encontrado'});
            contenido.destroy();
            res.status(204).json({msg:'Contenido eliminado exitosamente'});
        }
    }catch(err){
        res.status(500).json({msg:err.message})
    }
}

// Agregar contenido
const agregarContenido = async (req, res) => {
    try {
        const {
            titulo,
            poster,
            categoria,
            genero,
            resumen,
            temporadas,
            duracion,
            trailer,
            reparto 
        } = req.body;

        if (!titulo || !poster || !categoria || !genero || !resumen || !trailer) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        // Crear el nuevo contenido
        const contenidoNuevo = await Contenido.create({
            titulo,
            poster,
            categoria,
            genero,
            resumen,
            temporadas,
            duracion,
            trailer
        });

        if (Array.isArray(reparto) && reparto.length > 0) {
            const contenidoReparto = reparto.map(id_actor => ({
                id_contenido: contenidoNuevo.id_contenido,
                id_actor
            }));

            // Inserta todas las asociaciones
            await ContenidoActores.bulkCreate(contenidoReparto);
        }

        res.status(201).json({
            contenido: contenidoNuevo,
            reparto: reparto 
        });
    } catch (error) {
        res.status(500).json({ error: `Ocurrió un error`, message: error.message });
    }
};


// Actualizacion de contenidos
const actualizarContenido = async (req, res) => {
    try {
        const { id } = req.params; 
        const datosActualizados = req.body;

        const contenido = await Contenido.findByPk(id);
        
        if (!contenido) {
            return res.status(404).json({ msg: 'Contenido no encontrado.' });
        }

        await contenido.update(datosActualizados);

        res.status(200).json({ msg: 'Contenido actualizado correctamente.', contenido });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar el contenido.', error: error.message });
    }
};


module.exports = { 
    obtenerContenidos, 
    obtenerPorId, 
    filtrarContenido, 
    eliminarContenido, 
    agregarContenido,
    actualizarContenido
};
