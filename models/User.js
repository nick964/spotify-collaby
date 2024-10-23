import { auth, db} from '../lib/firebase';
import { doc, getDoc, setDoc } from '../lib/firebase';

export default class User {
    constructor(user) {
        this.user = user;
    }

    
    async save() {
        const userRef = doc(db, 'users', this.user.uid);
        await setDoc(userRef, this.user);
    }
    
    static async get(uid) {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
        return new User(userDoc.data());
        } else {
        return null;
        }
    }
    

}