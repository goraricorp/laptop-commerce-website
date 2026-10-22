const Category = require('../models/Category');

class CategoryController {
    async index(req, res) {
        try {
            const categories = await Category.findAll();
            return res.json(categories);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async store(req, res) {
        try {
            const { category_name, category_description, category_image } = req.body;
            const category = await Category.create({ category_name, category_description, category_image });
            return res.json(category);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const category = await Category.findByPk(id);
            return res.json(category);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // async update(req, res) {
    //     try {
    //         const { id } = req.params;
    //         const { category_name, category_description, category_image } = req.body;
    //         const category = await Category.findByPk(id);
    //         category.category_name = category_name;
    //         category.category_description = category_description;
    //         category.category_image = category_image;
    //         await category.save();
    //         return res.json(category);
    //     } catch (error) {
    //         return res.status(500).json({ error: error.message });
    //     }
    // }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const category = await Category.findByPk(id);
            await category.destroy();
            return res.json(category);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getCategory(req, res) {
        try {
            // console.log('Fetching categories...');
            const categories = await Category.findAll();
            // console.log('Categories fetched successfully:', categories);
            res.status(200).json(categories);
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ message: 'Error fetching category', error });
        }
    }

    async deleteCategory(req, res) {
        try {
            const { id } = req.params

            const category = await Category.findOne({
                where: {
                    idcategory: id
                }
            });

            await category.destroy();
            res.status(200).json({ success: true, message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Error deleting Category:', error);
            res.status(500).json({ success: false, message: 'Error deleting Category', error });
        }
    }

    async updateCategory(req, res) {
        try {
            function convertBackslashesToSlashes(path) {
                return path.replace(/\\/g, '/');
            }
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            const ImagePath = path.join(__dirname, '../../../client/public/assets/img/product');
            if (!fs.existsSync(ImagePath)) {
                fs.mkdirSync(ImagePath, { recursive: true });
            }
            const filePath = `/assets/img/categories/${req.file.filename}`;
            const filepath = convertBackslashesToSlashes(filePath);
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Category ID is required' });
            }

            const datas = req.body;
            if (!datas || Object.keys(datas).length === 0) {
                return res.status(400).json({ message: 'No update data provided' });
            }

            const category = await Category.findOne({
                where: { idcategory: id },
            });

            if (!category) {
                return res.status(404).json({ message: `No category found with id ${id}` });
            }

            await category.update({
                category_name: datas.category_name,
                category_description: datas.category_description,
                category_image: filepath,
            });

            res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ success: false, message: 'Error updating category', error });
        }
    }

    async createCategory(req, res) {
        try {
            const data = req.body;

            const category = await Category.create({
                category_name: data.category_name,
                category_description: data.category_description,
                category_image: data.category_image
            });

            return res.status(201).json({
                category: category,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error create user', error });
        }
    }

}

module.exports = new CategoryController();