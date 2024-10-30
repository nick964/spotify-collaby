"use client";

import { useState, useEffect, Suspense } from "react";

import { addDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import  { JoinGroupCode }  from '../../components/ui/join-group-code';

export default function JoinGroupPage() {
    return (
     <Suspense fallback={<div>Loading...</div>}>
            <JoinGroupCode />
      </Suspense>
        
    )
    

}