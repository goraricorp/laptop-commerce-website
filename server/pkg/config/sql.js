const Sequelize = require('sequelize');

const sequelize = new Sequelize('wt_proj', 'root', 'Japtor@1999', {
    host: 'localhost',
    dialect: 'mysql',
});

const Category = sequelize.define('category', {
    idcategory: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    category_name: Sequelize.STRING,
});

const Color = sequelize.define('color', {
    idcolor: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    color_name: Sequelize.STRING,
});

const Configuration = sequelize.define('configuration', {
    idconfiguration: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    configuration_name: Sequelize.STRING,
});

const Description = sequelize.define('description', {
    iddescription: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    description_title: Sequelize.STRING,
    description_content: Sequelize.STRING,
    description_image: Sequelize.STRING,
});

const Product = sequelize.define('product', {
    idproduct: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idcategory: Sequelize.INTEGER,
    product_name: Sequelize.STRING,
});

const Rating = sequelize.define('rating', {
    idrating: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    rating_number: Sequelize.INTEGER,
});

const Review = sequelize.define('review', {
    idreview: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    review_content: Sequelize.TEXT,
    review_date: Sequelize.DATEONLY,
});

const Accessory = sequelize.define('accessory', {
    idaccessory: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    accessory_name: Sequelize.STRING,
});

const AccessoryProduct = sequelize.define('accessory_product', {
    idaccessory_product: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    idaccessory: Sequelize.INTEGER,
});

const Attribute = sequelize.define('attribute', {
    idattribute: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    attribute_name: Sequelize.STRING,
});

const AttributeValue = sequelize.define('attribute_value', {
    idattribute_value: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idattribute: Sequelize.INTEGER,
    attribute_value: Sequelize.STRING,
});

const AttributeProduct = sequelize.define('attribute_product', {
    idattribute_product: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    idattribute_value: Sequelize.INTEGER,
});

const Brand = sequelize.define('brand', {
    idbrand: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    brand_name: Sequelize.STRING,
});

const BrandProduct = sequelize.define('brand_product', {
    idbrand_product: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    idbrand: Sequelize.INTEGER,
});

const Cart = sequelize.define('cart', {
    idcart: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    iduser: Sequelize.INTEGER,
});

const CartItem = sequelize.define('cart_item', {
    idcart_item: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idcart: Sequelize.INTEGER,
    idproduct: Sequelize.INTEGER,
    quantity: Sequelize.INTEGER,
    idcolor: Sequelize.INTEGER,
    idconfiguration: Sequelize.INTEGER,
});

const ColorProduct = sequelize.define('color_product', {
    idcolor_product: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    idcolor: Sequelize.INTEGER,
});

const ConfigurationProduct = sequelize.define('configuration_product', {
    idconfiguration_product: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idproduct: Sequelize.INTEGER,
    idconfiguration: Sequelize.INTEGER,
});

const Discount = sequelize.define('discount', {
    iddiscount: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    discount_name: Sequelize.STRING,
    discount_percent: Sequelize.INTEGER,
});

const DiscountProduct = sequelize.define('discount_product', {
    iddiscount_product: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    iddiscount: Sequelize.INTEGER,
    idproduct: Sequelize.INTEGER,
});

const Order = sequelize.define('order', {
    idorder: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    iduser: Sequelize.INTEGER,
    order_date: Sequelize.DATEONLY,
    order_status: Sequelize.STRING,
});

const OrderItem = sequelize.define('order_item', {
    idorder_item: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    idorder: Sequelize.INTEGER,
    idproduct: Sequelize.INTEGER,
    quantity: Sequelize.INTEGER,
    idcolor: Sequelize.INTEGER,
    idconfiguration: Sequelize.INTEGER,
});

const User = sequelize.define('user', {
    iduser: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    username: Sequelize.STRING,
    password: Sequelize.STRING,
});

// Associations
Category.hasMany(Product);
Product.belongsTo(Category);

Color.hasMany(ColorProduct);
ColorProduct.belongsTo(Color);
Product.hasMany(ColorProduct);
ColorProduct.belongsTo(Product);

Configuration.hasMany(ConfigurationProduct);
ConfigurationProduct.belongsTo(Configuration);
Product.hasMany(ConfigurationProduct);
ConfigurationProduct.belongsTo(Product);

Description.belongsTo(Product);
Product.hasMany(Description);

Rating.belongsTo(Product);
Product.hasMany(Rating);

Review.belongsTo(Product);
Product.hasMany(Review);

Accessory.hasMany(AccessoryProduct);
AccessoryProduct.belongsTo(Accessory);
Product.hasMany(AccessoryProduct);
AccessoryProduct.belongsTo(Product);

Attribute.hasMany(AttributeValue);
AttributeValue.belongsTo(Attribute);

AttributeValue.hasMany(AttributeProduct);
AttributeProduct.belongsTo(AttributeValue);
Product.hasMany(AttributeProduct);
AttributeProduct.belongsTo(Product);

Brand.hasMany(BrandProduct);
BrandProduct.belongsTo(Brand);
Product.hasMany(BrandProduct);
BrandProduct.belongsTo(Product);

Cart.belongsTo(User);
User.hasMany(Cart);

CartItem.belongsTo(Cart);
Cart.hasMany(CartItem);
CartItem.belongsTo(Product);
Product.hasMany(CartItem);
CartItem.belongsTo(Color);
Color.hasMany(CartItem);
CartItem.belongsTo(Configuration);
Configuration.hasMany(CartItem);

Discount.hasMany(DiscountProduct);
DiscountProduct.belongsTo(Discount);
Product.hasMany(DiscountProduct);
DiscountProduct.belongsTo(Product);