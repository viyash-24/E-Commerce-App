import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import Product from "@/models/Protect";

// Configure Cloudinary with trimmed env vars to avoid stray spaces
const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const CLOUDINARY_API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim();
const CLOUDINARY_API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();

cloudinary.config({
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET,
          secure: true
})

export async function POST(request){
          try {
                    const {userId}=getAuth(request)
                    const isSeller=await authSeller(userId)

                    if (!isSeller) {
                              return NextResponse.json({success:false,message:'not authorized'},{status:401})
                    }

                    // Validate Cloudinary configuration at request time as well
                    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
                              return NextResponse.json({success:false,message:'Cloudinary is not configured'}, {status:500})
                    }
                    const formData =await request.formData()

                    const name=formData.get('name');
                    const description=formData.get('description');
                    const category=formData.get('category');
                    const price=formData.get('price');
                    const offerPrice=formData.get('offerPrice');

                    const files=formData.getAll('images');

                    if (!files || files.length === 0) {
                              return NextResponse.json({success:false,message:'no files uploaded'}, {status:400})
                    }

                    const result =await Promise.all(
                              files.map(async (file)=>{
                                        const arrayBuffer =await file.arrayBuffer()
                                        const buffer=Buffer.from(arrayBuffer)

                                        return new Promise((resolve,reject)=>{
                                                  const stream =cloudinary.uploader.upload_stream(
                                                            {resource_type:'auto'},
                                                            (error,result)=>{
                                                                      if(error){
                                                                                reject(error)
                                                                      }else {
                                                                                resolve(result)
                                                                      }
                                                            }
                                                  )
                                                  stream.end(buffer)
                                        })

                              })
                    )

             const image=result.map(result =>result.secure_url)
            await connectDB()

            const newProduct=await Product.create({
                    userId,
                    name,
                    description,
                    category,
                    price:Number(price),
                    offerPrice:Number(offerPrice),
                    image,
                    date:Date.now()
            })
            return NextResponse.json({success:true,message:"Upload Successful",newProduct},{status:201})

          } catch (error) {
                    return NextResponse.json({success:false,message:error.message},{status:500})
          }
}
 
