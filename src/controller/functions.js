const moment = require('moment-timezone')
const fs = require('fs')
const request = require('request-promise')
const config = ('../config.js')
const bubble = require('../json/bubble.json')

/**
 * a function that constructs a carousel message for homework
 *
 * Example homework object:
 * {
 *     "Calculus": {
 *         "deadline": (DateTime Object),
 *         "link": (URL)
 *     }
 * }
 *
 * @param arr Array containing homework objects
 */
const generateHomework = arr => ({
    "type": "flex",
    "altText": "homework",
    "contents": {
        "type": "carousel",
        "contents": generateBubbles(arr),
    },
});

// Function to sort array of objects by parameter
const sortByParam = (arr, param) => {
    const arrCopy = [...arr]
    arrCopy.sort((a, b) => {
        let dateA = new Date(a[param]);
        let dateB = new Date(b[param]);
        return dateA - dateB;
    })
    return arrCopy
};
// E.g sort by sortByParam(arr, 'deadline')

// Returns deadline from JS DateTime Object
const getDeadlineFromDate = dateTimeObject => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[dateTimeObject.getMonth()]} ${dateTimeObject.getDate()}`
}

// Deep Clone Function
const clone = (obj) => {
    if (obj === null || typeof (obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

    if (obj instanceof Date)
        var temp = new obj.constructor(); //or new Date(obj);
    else
        var temp = obj.constructor();

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj['isActiveClone'] = null;
            temp[key] = clone(obj[key]);
            delete obj['isActiveClone'];
        }
    }
    return temp;
}

// Converts object of objects into an array of objects
const toArray = (obj_obj) => Object.keys(obj_obj).map(i => obj_obj[i]);

// Returns array of subjects with assignments sorted by deadline
const getSubjectAssignmentsSorted = arr => (
    arr.map(subject => {
        const assignments = toArray(JSON.parse(JSON.stringify(subject))["assignments"])
        const sorted = sortByParam(assignments, 'deadline')
        return {
            'title': subject['title'],
            'latest': sorted[0]['deadline']
        }
    })
)

// Generates array of Line Flex Bubble message JSON
const generateBubbles = arr => {

    const subjects = sortByParam(getSubjectAssignmentsSorted(arr), 'latest')
    return subjects.map(subject => {
        let bubbleClone = clone(bubble)
        bubbleClone["header"]["contents"][0]["text"] = subject['title']
        bubbleClone["hero"]["contents"][0]["text"] = "📅 Deadline" +
            getDeadlineFromDate(new Date(subject['latest']))
        bubbleClone["hero"]["contents"][0]["contents"][0]["text"] = "📅 Deadline: "
        bubbleClone["hero"]["contents"][0]["contents"][1]["text"] =
            getDeadlineFromDate(new Date(subject['latest']))
        bubbleClone["footer"]["contents"][0]["action"]["data"] = `homework/${subject['title']}`
        return bubbleClone
    })
}

// Generate a message containing a list of subjects
const generateSubjectList = courses => ({
    "type": "text",
    "text": "Select from the following:\n" + courses.map(course => "- " + course["title"]).join("\n")
})

// Gets the local datetime from a UTC datetime
const getLocalFromUTC = UTCDateTime => moment(UTCDateTime).tz('Asia/Bangkok')

// Download the file from URL (Must catch error)
const downloadFileFromURL = async (URL, outputFileName) => {
    let buffer = await request.get({uri: URL, encoding: null})
    fs.writeFile(outputFileName, buffer, e => e ? console.error(e) : null)
}

const shortenURL = async URL => {
    const response = await request.post({
        uri: 'https://api-ssl.bitly.com/v4/shorten',
        headers: `Bearer ${config.bitly_token}`,
        body: URL
    })
    return response.link
}

const getClicksFromURL = async URL => {
    URL = URL.replace(/(^\w+:|^)\/\//, '');
    const response = await request.post({
        uri: `https://api-ssl.bitly.com/v4/bitlinks/${URL}/clicks/summary`
    })
    return response.total_clicks
}

// Remove file from specified path
const removeFile = path => fs.unlink(path, e => e ? console.error(e) : null)

// Function exports
module.exports = {
    generateHomework,
    generateSubjectList,
    getLocalFromUTC,
    downloadFileFromURL,
    removeFile
};
