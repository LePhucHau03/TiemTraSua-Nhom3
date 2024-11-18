import React, { useEffect, useState } from "react";
import axios from "axios";
import { message, notification } from "antd";
import { useSelector } from "react-redux";
import {
    callChangeQuantityCartItem, callDeleteCart,
    callDeleteOneProductInCart,
    callFetchDataCart, callPlaceOrder
} from "../../services/api.js";
import PayPalPayment from "../Payment/PayPalPayment.jsx";
import { useNavigate } from "react-router-dom";
import { ImCrying } from "react-icons/im";

const CartPage = () => {
    const [loading, setLoading] = useState(false); // New loading state
    const [cartItems, setCartItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [discountCode, setDiscountCode] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const user = useSelector((state) => state.account.user);
    const navigate = useNavigate();
    const [isDiscountApplied, setIsDiscountApplied] = useState(false);

    const [formData, setFormData] = useState({
        recipientName: "",
        recipientPhone: "",
        recipientAddress: "",
        paymentMethod: "cod",
    });

    useEffect(() => {
        fetchCartData();
    }, []);

    useEffect(() => {
        calculateTotalAmount();
    }, [cartItems, discountAmount]);

    const fetchCartData = async () => {
        try {
            const response = await callFetchDataCart(user.id);
            if (response.data) {
                setCartItems(response.data);
            } else {
                message.warning("No items found in the cart.");
            }
        } catch (error) {
            message.error("Failed to fetch cart data: " + error.message);
        }
    };

    const handleDeleteItem = async (id) => {
        try {
            await callDeleteOneProductInCart(id);
            setCartItems((prevItems) => prevItems.filter(item => item.id !== id));
            message.success("Item deleted from cart");
        } catch (error) {
            message.error("Failed to delete item: " + error.message);
        }
    };

    const clearCartItems = () => {
        setCartItems([]);
    };

    const handleQuantityChange = async (id, quantity) => {
        const validQuantity = Math.max(1, parseInt(quantity, 10) || 1);

        try {
            await callChangeQuantityCartItem(id, validQuantity);
            setCartItems((prevItems) => prevItems.map(item =>
                item.id === id ? { ...item, quantity: validQuantity } : item
            ));
        } catch (error) {
            message.error("Failed to update quantity: " + error.message);
        }
    };

    const calculateTotalAmount = () => {
        const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        setTotalAmount(subtotal - discountAmount);
    };

    const handleDiscountCodeChange = (event) => {
        setDiscountCode(event.target.value);
    };

    const applyDiscountCode = () => {
        if (isDiscountApplied) {
            message.info("Discount code has already been applied.");
            return;
        }

        if (discountCode.trim() === "DISCOUNT5" && totalAmount >= 200000) {
            setDiscountAmount(totalAmount * 0.05); // 5% discount
            setIsDiscountApplied(true);
            message.success("5% discount applied for orders over 200,000 VND!");
        } else if (discountCode.trim() === "DISCOUNT10" && totalAmount >= 1000000) {
            setDiscountAmount(totalAmount * 0.1); // 10% discount
            setIsDiscountApplied(true);
            message.success("10% discount applied for orders over 1,000,000 VND!");
        } else {
            message.error("Invalid discount code or minimum order amount not met.");
        }
    };

    const cancelDiscount = () => {
        setDiscountAmount(0);
        setIsDiscountApplied(false);
        setDiscountCode("");
        message.info("Discount has been canceled.");
    };

    const handleSubmit = async (event) => {
        setLoading(true); // Set loading to true
        event.preventDefault();
        console.log("Order submitted:", { ...formData, totalAmount, cartItems });

        const detailOrder = cartItems.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            productId: item.product.id,
            price: item.product.price,
        }));

        const data = {
            receiverName: formData.recipientName,
            receiverAddress: formData.recipientAddress,
            receiverPhone: formData.recipientPhone,
            totalPrice: totalAmount,
            paymentMethod: formData.paymentMethod,
            userId: user.id,
            orderDetails: detailOrder,
        };

        try {
            const res = await callPlaceOrder(data);
            if (res && res.data) {
                message.success('Đặt hàng thành công !');
                await callDeleteCart(user.id);
                setCartItems([]);
            } else {
                notification.error({
                    message: "Đã có lỗi xảy ra",
                    description: res.message || 'Vui lòng thử lại sau.',
                });
            }
        } catch (error) {
            notification.error({
                message: "Đã có lỗi xảy ra",
                description: error.message || 'Vui lòng thử lại sau.',
            });
        }finally {
            setLoading(false); // Reset loading to false
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const isFormValid = () => {
        return (
            formData.recipientName.trim() !== "" &&
            formData.recipientPhone.trim() !== "" &&
            formData.recipientAddress.trim() !== ""
        );
    };

    return (
        <>
            {cartItems.length > 0 ? (
                <div className="container mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-1">
                        <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
                        <div className="grid gap-6 mb-6">
                            {cartItems.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-center">
                                    <div className="md:flex items-center space-x-4">
                                        <img
                                            src={`http://localhost:8080/storage/category-thumbnail/${item.product.imageUrl}`}
                                            alt={item.product.name}
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                        <div>
                                            <h2 className="text-xl font-semibold">{item.product.name}</h2>
                                            <p className="text-gray-600">{item.product.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor={`quantity-${item.id}`} className="mr-2 text-gray-700">Quantity:</label>
                                        <input
                                            type="number"
                                            id={`quantity-${item.id}`}
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                            className="border border-gray-300 rounded-md py-2 px-3 w-20"
                                            min="1"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md mt-4 md:mt-0"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold">Total:</h2>
                            <p className="text-xl text-gray-800 font-bold">
                                {totalAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                            </p>
                            <div className="mt-4">
                                <input
                                    type="text"
                                    value={discountCode}
                                    onChange={handleDiscountCodeChange}
                                    placeholder="Enter discount code"
                                    className="border border-gray-300 rounded-md py-2 px-4 w-full"
                                />
                                <p className="text-gray-600 mt-2">
                                    💡 Use code <strong>DISCOUNT5</strong> for a 5% discount on orders over 200,000 VND, or <strong>DISCOUNT10</strong> for a 10% discount on orders over 1,000,000 VND!
                                </p>
                                <button
                                    onClick={applyDiscountCode}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2"
                                >
                                    Apply Discount
                                </button>
                                {isDiscountApplied && (
                                    <button
                                        onClick={cancelDiscount}
                                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-2 ml-2"
                                    >
                                        Cancel Discount
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <h2 className="text-2xl font-bold mb-4">Checkout</h2>
                        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                            {["recipientName", "recipientPhone", "recipientAddress"].map((field) => (
                                <div className="mb-4" key={field}>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field}>
                                        {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id={field}
                                        type={field === "recipientPhone" ? "tel" : "text"}
                                        name={field}
                                        value={formData[field]}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            ))}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
                                <div className="flex items-center">
                                    <input
                                        id="cod"
                                        type="radio"
                                        value="cod"
                                        name="paymentMethod"
                                        checked={formData.paymentMethod === "cod"}
                                        onChange={handleInputChange}
                                        className="mr-2"
                                    />
                                    <label htmlFor="cod" className="text-gray-700">Cash on Delivery (COD)</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="online"
                                        type="radio"
                                        value="online"
                                        name="paymentMethod"
                                        checked={formData.paymentMethod === "online"}
                                        onChange={handleInputChange}
                                        className="mr-2"
                                    />
                                    <label htmlFor="online" className="text-gray-700">Online Payment</label>
                                </div>
                            </div>
                            <div className="flex items-center">
                                {formData.paymentMethod === "online" ? (
                                    isFormValid() ? (
                                        <PayPalPayment clearCartItems={clearCartItems} totalAmount={totalAmount} formData={formData} cartItems={cartItems} userId={user.id} />
                                    ) : (
                                        <p className="text-red-500">Please fill out all fields to proceed with PayPal payment.</p>
                                    )
                                ) : (
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                        type="submit"
                                        disabled={loading} // Disable button when loading
                                    >
                                        {loading ? "Placing Order..." : "Place Order"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center mt-36">
                    <ImCrying size={100} className="text-blue-500 mb-6"/>
                    <p className="text-xl text-gray-700 mb-4">Your cart is feeling lonely.</p>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => navigate('/')}
                    >
                        Start Shopping
                    </button>
                    <div className="flex flex-col items-center justify-center h-screen"></div>
                </div>
            )}
        </>
    );
};

export default CartPage;
