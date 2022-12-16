
const mongoose = require('mongoose');

module.exports = {
    connectDb : (callback) => {
        // eslint-disable-next-line no-undef
        mongoose.connect('mongodb+srv://Soorajas:srj%40atlas@cluster0.ud8ty6k.mongodb.net/FirstProject')
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