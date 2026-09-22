// =========================================================
// GIAN ACTIVITY 4
// DHT11 FIREBASE MONITOR
// =========================================================


// =========================================================
// FIREBASE IMPORTS
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =========================================================
// GIAN FIREBASE CONFIGURATION
// =========================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyA2asUvUStpwcfK0Sk710jhHSHvUcS1Cs4",

    authDomain:
        "gian-8f559.firebaseapp.com",

    databaseURL:
        "https://gian-8f559-default-rtdb.europe-west1.firebasedatabase.app/",

    projectId:
        "gian-8f559",

    storageBucket:
        "gian-8f559.firebasestorage.app",

    messagingSenderId:
        "116902822790",

    appId:
        "1:116902822790:web:0f959cac7580d8bdc6a207",

    measurementId:
        "G-MHXTS1H3DH"

};


// =========================================================
// INITIALIZE FIREBASE
// =========================================================

const firebaseApp =
    initializeApp(firebaseConfig);


// =========================================================
// DATABASE
// =========================================================

const database =
    getDatabase(firebaseApp);


// =========================================================
// DATABASE PATH
// =========================================================

const dataRef =
    ref(
        database,
        "ESP32_Data"
    );


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let allSensorData = {};

let selectedDate = "";

let sensorChart = null;


// =========================================================
// DOM ELEMENTS
// =========================================================

const currentTemperature =
    document.getElementById(
        "currentTemperature"
    );

const currentHumidity =
    document.getElementById(
        "currentHumidity"
    );

const historyDate =
    document.getElementById(
        "historyDate"
    );

const historyBody =
    document.getElementById(
        "historyTableBody"
    );

const recordCount =
    document.getElementById(
        "recordCount"
    );

const toggleHistory =
    document.getElementById(
        "toggleHistory"
    );

const historyContent =
    document.getElementById(
        "historyContent"
    );

const statusText =
    document.getElementById(
        "statusText"
    );

const statusDot =
    document.getElementById(
        "statusDot"
    );


// =========================================================
// FIREBASE STATUS
// =========================================================

function setFirebaseStatus(
    text,
    connected
) {

    if (statusText) {

        statusText.textContent =
            text;

    }


    if (statusDot) {

        if (connected) {

            statusDot.classList.add(
                "connected"
            );

        }
        else {

            statusDot.classList.remove(
                "connected"
            );

        }

    }

}


// =========================================================
// NUMBER HELPER
// =========================================================

function toNumber(value) {

    const number =
        Number(value);


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    return null;

}


// =========================================================
// FORMAT NUMBER
// =========================================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "--";

    }


    return Number(value).toFixed(1);

}


// =========================================================
// GET DATE LIST
// =========================================================

function getDateList(data) {

    return Object.keys(
        data || {}
    )
    .filter(
        key =>
            data[key] &&
            typeof data[key] === "object"
    )
    .sort()
    .reverse();

}


// =========================================================
// GET READINGS FOR DATE
// =========================================================

function getReadingsForDate(
    date
) {

    const result = [];


    if (!date) {

        return result;

    }


    const dayData =
        allSensorData[date];


    if (
        !dayData ||
        typeof dayData !== "object"
    ) {

        return result;

    }


    const times =
        Object.keys(dayData)
        .filter(
            time =>
                dayData[time] &&
                typeof dayData[time] === "object"
        )
        .sort();


    times.forEach(
        time => {

            const reading =
                dayData[time];


            const temperature =
                toNumber(
                    reading.temperature
                );


            const humidity =
                toNumber(
                    reading.humidity
                );


            if (
                temperature === null &&
                humidity === null
            ) {

                return;

            }


            result.push({

                time:
                    time,

                temperature:
                    temperature,

                humidity:
                    humidity

            });

        }
    );


    return result;

}


// =========================================================
// GET LATEST READING
// =========================================================

function getLatestReading(
    data
) {

    let latest = null;


    const dates =
        Object.keys(
            data || {}
        ).sort();


    for (
        const date of dates
    ) {

        const times =
            Object.keys(
                data[date] || {}
            ).sort();


        for (
            const time of times
        ) {

            const reading =
                data[date][time];


            if (
                !reading ||
                typeof reading !== "object"
            ) {

                continue;

            }


            const temperature =
                toNumber(
                    reading.temperature
                );


            const humidity =
                toNumber(
                    reading.humidity
                );


            if (
                temperature === null &&
                humidity === null
            ) {

                continue;

            }


            latest = {

                date:
                    date,

                time:
                    time,

                temperature:
                    temperature,

                humidity:
                    humidity

            };

        }

    }


    return latest;

}


// =========================================================
// POPULATE HISTORY DATE SELECT
// =========================================================

function populateDateSelect() {

    const dates =
        getDateList(
            allSensorData
        );


    if (!historyDate) {

        return;

    }


    historyDate.innerHTML =
        "";


    if (
        dates.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            "";


        option.textContent =
            "NO DATES AVAILABLE";


        historyDate.appendChild(
            option
        );


        return;

    }


    dates.forEach(
        date => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                date;


            option.textContent =
                date;


            historyDate.appendChild(
                option
            );

        }
    );


    historyDate.value =
        selectedDate ||
        dates[0];

}


// =========================================================
// UPDATE CURRENT READING
// =========================================================

function updateCurrentReading() {

    const latest =
        getLatestReading(
            allSensorData
        );


    if (!latest) {

        currentTemperature.textContent =
            "-- °C";


        currentHumidity.textContent =
            "-- %";


        return;

    }


    currentTemperature.textContent =
        formatNumber(
            latest.temperature
        ) +
        " °C";


    currentHumidity.textContent =
        formatNumber(
            latest.humidity
        ) +
        " %";


    console.log(
        "LATEST READING:",
        latest
    );

}


// =========================================================
// UPDATE GRAPH
// =========================================================

function updateChart() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

        return;

    }


    // =========================================
    // GRAPH NOW USES HISTORY DATE
    // =========================================

    const date =
        historyDate
            ? historyDate.value
            : selectedDate;


    const readings =
        getReadingsForDate(
            date
        );


    const labels =
        readings.map(
            item =>
                item.time
        );


    const temperatures =
        readings.map(
            item =>
                item.temperature
        );


    const humidities =
        readings.map(
            item =>
                item.humidity
        );


    const canvas =
        document.getElementById(
            "sensorChart"
        );


    if (!canvas) {

        return;

    }


    if (sensorChart) {

        sensorChart.destroy();

        sensorChart =
            null;

    }


    sensorChart =
        new Chart(
            canvas,
            {

                type:
                    "line",


                data:
                {

                    labels:
                        labels,


                    datasets:
                    [

                        {

                            label:
                                "Temperature (°C)",

                            data:
                                temperatures,

                            yAxisID:
                                "temperature",

                            tension:
                                0.3,

                            borderWidth:
                                2,

                            pointRadius:
                                3,

                            borderColor:
                                "#4c9fff",

                            backgroundColor:
                                "rgba(76,159,255,0.10)"

                        },


                        {

                            label:
                                "Humidity (%)",

                            data:
                                humidities,

                            yAxisID:
                                "humidity",

                            tension:
                                0.3,

                            borderWidth:
                                2,

                            pointRadius:
                                3,

                            borderColor:
                                "#8abfff",

                            backgroundColor:
                                "rgba(138,191,255,0.08)"

                        }

                    ]

                },


                options:
                {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    animation:
                    {

                        duration:
                            300

                    },


                    interaction:
                    {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    plugins:
                    {

                        legend:
                        {

                            labels:
                            {

                                color:
                                    "#b7c1c9"

                            }

                        }

                    },


                    scales:
                    {

                        x:
                        {

                            ticks:
                            {

                                color:
                                    "#697681"

                            },

                            grid:
                            {

                                color:
                                    "#252d34"

                            }

                        },


                        temperature:
                        {

                            type:
                                "linear",

                            position:
                                "left",


                            title:
                            {

                                display:
                                    true,

                                text:
                                    "Temperature (°C)",

                                color:
                                    "#697681"

                            },


                            ticks:
                            {

                                color:
                                    "#697681"

                            },


                            grid:
                            {

                                color:
                                    "#252d34"

                            }

                        },


                        humidity:
                        {

                            type:
                                "linear",

                            position:
                                "right",


                            title:
                            {

                                display:
                                    true,

                                text:
                                    "Humidity (%)",

                                color:
                                    "#697681"

                            },


                            ticks:
                            {

                                color:
                                    "#697681"

                            },


                            grid:
                            {

                                drawOnChartArea:
                                    false

                            }

                        }

                    }

                }

            }
        );


    console.log(
        "GRAPH UPDATED:",
        date,
        readings.length,
        "records"
    );

}


// =========================================================
// UPDATE HISTORY
// =========================================================

function updateHistory() {

    if (!historyBody) {

        return;

    }


    const date =
        historyDate
            ? historyDate.value
            : selectedDate;


    const readings =
        getReadingsForDate(
            date
        );


    historyBody.innerHTML =
        "";


    if (
        readings.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.classList.add(
            "empty-row"
        );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan =
            3;


        cell.textContent =
            "NO SENSOR DATA";


        row.appendChild(
            cell
        );


        historyBody.appendChild(
            row
        );


        recordCount.textContent =
            "0";


        return;

    }


    readings
        .slice()
        .reverse()
        .forEach(
            (reading, index) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                if (
                    index === 0
                ) {

                    row.classList.add(
                        "latest"
                    );

                }


                const timeCell =
                    document.createElement(
                        "td"
                    );


                const temperatureCell =
                    document.createElement(
                        "td"
                    );


                const humidityCell =
                    document.createElement(
                        "td"
                    );


                timeCell.textContent =
                    reading.time;


                temperatureCell.textContent =
                    formatNumber(
                        reading.temperature
                    ) +
                    " °C";


                humidityCell.textContent =
                    formatNumber(
                        reading.humidity
                    ) +
                    " %";


                row.appendChild(
                    timeCell
                );


                row.appendChild(
                    temperatureCell
                );


                row.appendChild(
                    humidityCell
                );


                historyBody.appendChild(
                    row
                );

            }
        );


    recordCount.textContent =
        readings.length;


    console.log(
        "HISTORY UPDATED:",
        date,
        readings.length,
        "records"
    );

}


// =========================================================
// UPDATE DASHBOARD
// =========================================================

function updateDashboard() {

    const dates =
        getDateList(
            allSensorData
        );


    console.log(
        "AVAILABLE DATES:",
        dates
    );


    if (
        dates.length === 0
    ) {

        currentTemperature.textContent =
            "-- °C";


        currentHumidity.textContent =
            "-- %";


        historyBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="3">
                    NO SENSOR DATA
                </td>

            </tr>

        `;


        recordCount.textContent =
            "0";


        return;

    }


    if (
        !selectedDate ||
        !dates.includes(
            selectedDate
        )
    ) {

        selectedDate =
            dates[0];

    }


    populateDateSelect();

    updateCurrentReading();

    updateChart();

    updateHistory();

}


// =========================================================
// FIREBASE LISTENER
// =========================================================

console.log(
    "================================="
);

console.log(
    "GIAN // MONITOR"
);

console.log(
    "CONNECTING TO FIREBASE"
);

console.log(
    "Database path: /ESP32_Data"
);

console.log(
    "================================="
);


setFirebaseStatus(
    "CONNECTING",
    false
);


onValue(

    dataRef,


    (snapshot) => {

        console.log(
            "FIREBASE DATA RECEIVED"
        );


        allSensorData =
            snapshot.val() || {};


        setFirebaseStatus(
            "CONNECTED",
            true
        );


        updateDashboard();

    },


    (error) => {

        console.error(
            "FIREBASE READ ERROR:",
            error
        );


        setFirebaseStatus(
            "ERROR",
            false
        );

    }

);


// =========================================================
// HISTORY DATE CHANGE
// =========================================================

if (historyDate) {

    historyDate.addEventListener(
        "change",
        function() {

            selectedDate =
                this.value;


            updateHistory();

            updateChart();

        }
    );

}


// =========================================================
// SHOW / HIDE HISTORY
// =========================================================

if (toggleHistory) {

    toggleHistory.addEventListener(
        "click",
        function() {

            if (
                historyContent.classList.contains(
                    "hidden"
                )
            ) {

                historyContent.classList.remove(
                    "hidden"
                );


                toggleHistory.textContent =
                    "HIDE HISTORY";


                updateHistory();

            }
            else {

                historyContent.classList.add(
                    "hidden"
                );


                toggleHistory.textContent =
                    "SHOW HISTORY";

            }

        }
    );

}


// =========================================================
// READY
// =========================================================

console.log(
    "GIAN ACTIVITY 4 MONITOR READY"
);