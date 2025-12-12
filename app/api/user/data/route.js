import connectDB from "@/config/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import {getAuth} from "@clerk/nextjs/server";


export async function GET(request){
          try {
                                     const { userId } = getAuth(request)

                                     if (!userId) {
                                         return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
                                     }

                   await connectDB()
                                     const user = await User.findById(userId)

                   if (!user) {
                                        return NextResponse.json({ success: false, message: "User Not Found" }, { status: 404 })
                   }

                                        return NextResponse.json({ success: true, user }, { status: 200 })

                    } catch (error) {
                     return NextResponse.json({ success: false, message: error.message }, { status: 500 })

          } 
}