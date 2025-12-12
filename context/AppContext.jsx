'use client'
import { userDummyData } from "@/assets/assets";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const {user} =useUser()
    const {getToken} =useAuth()
    

    const [products, setProducts] = useState([])
    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [cartItems, setCartItems] = useState({})

    const fetchProductData = async () => {
        try {
            const {data} = await axios.get('/api/product/list')

            if (data.success) {
                setProducts(data.products)
                
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchUserData = async () => {
        try {
            if (user.publicMetadata.role === 'seller') {
            setIsSeller(true)            
        }   
        
        const token = await getToken()

        const resp = await axios.get('/api/user/data',{headers:{Authorization:`Bearer ${token}`}})
        const { data } = resp

        if (data.success){
            setUserData(data.user)
            setCartItems(data.user.cartItems)
        }else{
            // Avoid noisy toasts for expected states
            if (resp.status !== 401 && resp.status !== 404) {
                toast.error(data.message)
            }
        }
        
        } catch (error) {
            // Handle API status-specific errors
            const status = error?.response?.status
            const msg = error?.response?.data?.message || error.message
            if (status === 401 || status === 404) {
                // silently ignore unauthenticated or missing user on initial load
                return
            }
            toast.error(msg)
        }
    }

    const addToCart = async (itemId) => {

        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] += 1;
        }
        else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData);
        
        if (user) {
            try {
                const token =await getToken()

                await axios.post('/api/cart/update',{cartData} , {headers:{Authorization :`Bearer ${token}`}})
                toast.success('Iteam added to cart')
            } catch (error) {
                toast.error(error.message)
            }
            
        }



    }

    const updateCartQuantity = async (itemId, quantity) => {

        let cartData = structuredClone(cartItems);
        if (quantity === 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }
        setCartItems(cartData)
        if (user) {
            try {
                const token =await getToken()

                await axios.post('/api/cart/update',{cartData} , {headers:{Authorization :`Bearer ${token}`}})
                toast.success('cart updated')
            } catch (error) {
                toast.error(error.message)
            }
            
        }

    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            if (cartItems[items] > 0) {
                totalCount += cartItems[items];
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData()
    }, [])

    useEffect(() => {
        if (user) {
            fetchUserData()
        }
        
    }, [user])

    const value = {
        user,getToken,
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData,
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}