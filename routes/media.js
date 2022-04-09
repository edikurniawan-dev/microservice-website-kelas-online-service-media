const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const { Media } = require('../models');
const fs = require('fs');

router.get('/', async (req, res) => {
    try {
        const media = await Media.findAll({
            attributes: ['id', 'image'],
        });

        const mappedMedia = media.map((m) => {
            m.image = `${req.get('host')}/${m.image}`;
            return m;
        });

        return res.status(200).json({
            status: 'success',
            data: mappedMedia,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.post('/', (req, res) => {
    const image = req.body.image;

    if (!isBase64(image, { mimeRequired: true })) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid base64 image',
        });
    }

    base64Img.img(image, 'public/images', Date.now(), async (err, filepath) => {
        if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message,
            });
        }

        const filename = filepath.split('\\').pop().split('/').pop();

        try {
            const media = await Media.create({
                image: `images/${filename}`,
            });

            return res.json({
                status: 'success',
                data: {
                    id: media.id,
                    image: `${req.get('host')}/images/${filename}`,
                },
            });
        } catch (error) {
            return res.status(400).json({
                status: 'error',
                message: error.message,
            });
        }
    });
});

router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const media = await Media.findByPk(id);

    if (!media) {
        return res.status(400).json({
            status: 'error',
            message: 'image not found',
        });
    }

    fs.unlink(`public/${media.image}`, (err) => {
        if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message,
            });
        }

        media.destroy();

        return res.json({
            status: 'success',
            data: {
                id: media.id,
                image: `${req.get('host')}/${media.image}`,
            },
        });
    });
});

module.exports = router;
