import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  googleId?: string;
  products?: ObjectId[]; // Array of product IDs associated with the user
}

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  expires: string;
} 