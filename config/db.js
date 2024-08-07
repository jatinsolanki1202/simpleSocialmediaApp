const mongoose = require('mongoose');

const dbConection = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Connected to database ${conn.connection.host}`);
    } catch (error) {
        console.error(error.message);
    }
}


module.exports = dbConection