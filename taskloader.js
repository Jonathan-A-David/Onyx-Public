const csv=require('csvtojson')
let tasks = []

async function getTasks() {
    return csv()
    .fromFile('./tasks.csv')
    .then((json)=>{
        for (i = 0; i < json.length; i++) {
            tasks.push(json[i])
        }
    })
}

exports.getTasks = getTasks
exports.tasks = tasks