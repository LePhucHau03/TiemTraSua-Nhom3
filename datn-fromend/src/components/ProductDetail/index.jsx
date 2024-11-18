import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { callFetchProductById, callAddToCart, callFetchProductsByCategory } from "../../services/api.js";
import { useSelector } from "react-redux";
import { message, Modal } from "antd";
import { useNavigate } from "react-router-dom";

const ProductDetail = () => {
    const [data, setData] = useState();
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const user = useSelector((state) => state.account.user);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData(id);
    }, [id]);

    const fetchData = async (id) => {
        const res = await callFetchProductById(id);
        if (res && res.data) {
            setData(res.data);
            fetchRelatedProducts(res.data.category.id);
        }
    };

    const fetchRelatedProducts = async (categoryId) => {
        const res = await callFetchProductsByCategory(categoryId);
        if (res && res.data) {
            const currentProductId = parseInt(id, 10);
            setRelatedProducts(res.data.filter(product => product.id !== currentProductId && product.active));
        }
    };

    const handleAddToCart = async () => {
        const cartData = { userID: user.id, productID: data.id, quantity };
        const response = await callAddToCart(cartData);
        response && response.data
            ? message.success("Product added to cart successfully!")
            : message.error("Failed to add product to cart.");
    };

    const showImagePreview = (imageUrl) => {
        setPreviewImage(imageUrl);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    return (
        <>
            {data && (
                <div className="container mx-auto px-4 py-8">
                    {/* Product Overview */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/3">
                            <img
                                src={`${import.meta.env.VITE_BACKEND_URL}/storage/category-thumbnail/${data.imageUrl}`}
                                alt={data.name}
                                className="w-full h-auto rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                                onClick={() => showImagePreview(`${import.meta.env.VITE_BACKEND_URL}/storage/category-thumbnail/${data.imageUrl}`)}
                            />
                        </div>
                        <div className="md:w-2/3">
                            <h1 className="text-4xl font-bold text-purple-900 mb-4">{data.name}</h1>
                            <p className="text-gray-600 text-lg mb-4">{data.category.name}</p>
                            <p className="text-2xl text-red-500 font-bold mb-4">
                                {data.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                            </p>
                            <p className="text-gray-700 mb-6">{data.description}</p>
                            <div className="flex items-center mb-4">
                                <label className="mr-4">Quantity:</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="border rounded-lg w-16 text-center"
                                    min="1"
                                />
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-700 transition"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>

                    {/* Related Products */}
                    <div className="mt-12">
                        <h2 className="text-3xl font-bold text-purple-900 mb-6">Sản phẩm cùng loại</h2>
                        {relatedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {relatedProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="p-4 bg-white shadow-lg rounded-lg hover:shadow-xl transition cursor-pointer"
                                    >
                                        <img
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/category-thumbnail/${product.imageUrl}`}
                                            alt={product.name}
                                            className="w-full h-48 object-cover rounded-lg mb-4"
                                        />
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                                        <p className="text-red-500 font-bold mb-2">
                                            {product.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                        </p>
                                        <button
                                            onClick={() => handleAddToCart(product.id)}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">Không có sản phẩm cùng loại nào để hiển thị.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            <Modal visible={isModalVisible} onCancel={handleCancel} footer={null} centered width={800}>
                <img src={previewImage} alt="Preview" className="w-full h-auto" />
            </Modal>
        </>
    );
};

export default ProductDetail;
