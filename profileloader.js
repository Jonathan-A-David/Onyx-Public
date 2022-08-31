const csv = require('csvtojson')
let profiles = [] 

function getProfiles() {
    return csv()
    .fromFile('./profiles.csv')
    .then((json)=>{
        for (i = 0; i < json.length; i++) {
            profiles.push(json[i])
        }
    })
}

exports.getProfiles = getProfiles
exports.profiles = profiles