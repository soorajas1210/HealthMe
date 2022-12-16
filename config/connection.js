
const mongoose = require('mongoose');

module.exports = {
    connectDb : (callback) => {
        // eslint-disable-next-line no-undef
        mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log("connected to db");
                return callback();
            })
            .catch((err) => {
                console.log(err);
                return callback(err);
            })
    }
}