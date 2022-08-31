const figchalk = require('figchalk')
const { prompt } = require('enquirer');
const {MongoClient} = require('mongodb');
const uri = "RETRACTED";
const client = new MongoClient(uri);
const taskLoader = require('./src/taskloader.js')
const profileLoader = require('./src/profileloader.js')
const NB = require('./src/nb.js')
const setTitle = require('node-bash-title');
let formattedTasks; 
let attempts = 0;
let taskArray = [];

async function start() {
    let response = await prompt({
        type: 'input', 
        name: 'key',
        message: 'Enter Your Key'
    })
    let authStatus = await checkKey(response.key)

    if (authStatus === true) {
        console.log(figchalk.chalk('Successfully Authenticated', 'greenBright'))
        await initialize()
        menu()
    } else {
        console.log(figchalk.chalk('Invalid Key', 'red'))
        await start()
    }
}

async function initialize() {
    await profileLoader.getProfiles()
    await taskLoader.getTasks()
    formattedTasks = await createTasks()
    setTitle(`JHNY AIO  ||      Carted -- [0]            Success -- [0]             Declines-- [0]`)
    console.clear()
    console.log(figchalk.mix("JHNY AIO", "greenBright", "doom"))
    console.log(figchalk.chalk('Loading Tasks...', 'yellow'))
    console.log(figchalk.chalk('Loading Profiles...', 'yellow'))
    return 'finished'; 
}

async function createTasks() {
    let list = []
    for (i = 0; i < taskLoader.tasks.length; i++) {
        for (index = 0; index < profileLoader.profiles.length; index++) {
            if (taskLoader.tasks[i].profile == profileLoader.profiles[index].profileName) {
                let currentTask = taskLoader.tasks[i]
                let currentProfile = profileLoader.profiles[index]
                let obj = {
                    sku: currentTask.sku,
                    styleCode: currentTask.styleCode,
                    size: currentTask.size,
                    proxy: currentTask.proxy,
                    settings: {
                        webhook: currentTask.webhook, 
                        monitorDelay: 3000, 
                        retryDelay: 3000, 
                    },
                    profile: {
                        name: currentProfile.profileName,
                        fname: currentProfile.fname,
                        lname: currentProfile.lname,
                        state: currentProfile.state,
                        city: currentProfile.city, 
                        zip: currentProfile.zip,
                        address: currentProfile.address,
                        address2: currentProfile.address2,
                        email: currentProfile.email, 
                        phoneNum: currentProfile.phoneNum,
                        card: {
                            type: currentProfile.cardType,
                            num: currentProfile.cardNum,
                            month: currentProfile.cardMonth,
                            year: currentProfile.cardYear,
                            cvv: currentProfile.cvv
                        }
                    }
                }
                list.push(obj)
            }
        }
    }
    return list; 
}

async function menu() {

    console.log('\n')
    console.log(figchalk.chalk('[1] - Start Tasks', 'cyan'))
    console.log(figchalk.chalk('[2] - Stop Tasks', 'cyan'))
    console.log(figchalk.chalk('[3] - Mass Edit Tasks', 'cyan'))
    console.log(figchalk.chalk('[4] - View Profiles', 'cyan'))
    console.log(figchalk.chalk('[5] - View Tasks', 'cyan'))
    console.log('\n')

    let response = await prompt({
        type: 'input', 
        name: 'funcNum', 
        message: 'Which function would you like to run?'
    })

    if (response.funcNum == 1) {
        console.log(figchalk.chalk('Starting Tasks', 'greenBright'))
        console.log('\n')
        await startTasks()
        await Promise.all(taskArray)
        menu()

    } else if (response.funcNum == 2) {
        console.log('Stopping Tasks')
    } else if (response.funcNum == 3) {
        console.log('Mass Edit Tasks')
        let response = prompt({
            type: 'input', 
            name: 'sku',
            message: 'What would you like to change the sku to?'
        })
        await massEdit(response)
    } else if (response.funcNum == 4) {
        console.log('\n')
        console.log(profileLoader.profiles)
        back()
    } else if (response.funcNum == 5) {
        console.log('\n')
        console.log(taskLoader.tasks)
        back()
    } else {
        console.log(figchalk.chalk('Invalid Input', 'red'))
        menu()
    }

}

async function massEdit(response) {
    for (i = 0; i < formattedTasks; i++) {
        formattedTasks[i].sku = response.sku
    }
    return formattedTasks
}

const back = async() => {
    console.log('\n')
    console.log(figchalk.chalk('[1] - Go Back', 'cyan'))
    let response = await prompt({
        type: 'input', 
        name: 'funcNum', 
        message: 'Go Back'
    })
    if (response.funcNum == 1) {
        menu()
    } else {
        console.log('Please enter a valid input')
        back()
    }
}

async function findKey(client, key) {
    result = await client.db("Onyx").collection("Auth")
                        .findOne({ keys: key });
    if (result) {
        return true; 
    } else {
        return false; 
    }
}

async function checkKey(key) {
    try {
        if (attempts == 0) {
            await client.connect()
        }

    let findStatus = await findKey(client, key)

    if (findStatus === true) {
        await client.close()
        return true
    } else {
        attempts = attempts + 1
        return false
    }

    }
    catch(e) {
        console.log(e)
    }
}

async function startTasks() {

    for (i = 0; i < formattedTasks.length; i++) {
        taskArray.push(new NB.NB(formattedTasks[i]).start())
    }

    return taskArray; 

}

start()



