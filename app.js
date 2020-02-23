var express = require('express');
var category = require('./category');
var daily = require('./date');
var shared = require('./shared');

const port = 8888;

var app = express();
app.use(express.json());

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function sendResponse(res, json) {
    res.send(JSON.stringify(json));
}

var totalCounts = {
    "processed": 0,
    "dropped": 0,
    "delivered": 0,
    "bounce": 0,
    "deferred": 0,
    "open": 0,
    "click": 0,
    "unsubscribe": 0,
    "group_unsubscribe": 0,
    "group_resubscribe": 0,
    "spamreport": 0,
};
var categoryCounts = {};
var dailyCounts = {};
var weekdayCounts = {};
var hourlyCounts = {};
var totalEvents = 0;

app.post('/', function (req, res) {
    console.log(req.headers);
    var payloads = req.body;
    if (req.headers["user-agent"] === "SendGrid Event API" || req.headers["user-agent"] === "Go-http-client/1.1") {
        for (const payload of payloads) {
            console.log(payload);
            totalEvents++;
            totalCounts[payload.event]++;
            category.incrementCategoryStats(categoryCounts, payload);
            daily.incrementDateStats(dailyCounts, weekdayCounts, hourlyCounts, payload);
        }
    }
    return res.status(200).send("received events");
});

app.get('/total_stats', function (req, res) {
    sendResponse(res, totalCounts);
});

app.get('/total_events', function (req, res) {
    sendResponse(res, { "total": totalEvents });
});

app.get('/total_requests', function (req, res) {
    sendResponse(res, { "requests": totalCounts["processed"] + totalCounts["dropped"] });
});

app.get('/category_stats', function (req, res) {
    sendResponse(res, categoryCounts);
});

app.get('/category_stats/:cat', function (req, res) {
    sendResponse(res, shared.getStatsForKey(categoryCounts, req.params.cat, "category"));
});

app.get('/daily_stats', function (req, res) {
    sendResponse(res, dailyCounts);
});

app.get('/daily_stats/:day', function (req, res) {
    sendResponse(res, shared.getStatsForKey(dailyCounts, req.params.day, "date"));
});

app.get('/weekday_stats', function (req, res) {
    sendResponse(res, weekdayCounts);
});

app.get('/weekday_stats/:day', function (req, res) {
    sendResponse(res, shared.getStatsForKey(weekdayCounts, capitalizeFirstLetter(req.params.day), "weekday"));
});

app.get('/hourly_stats', function (req, res) {
    sendResponse(res, hourlyCounts);
});

app.get('/hourly_stats/:hour', function (req, res) {
    sendResponse(res, shared.getStatsForKey(hourlyCounts, req.params.hour, "hour"));
});

app.get('/clear', function (req, res) {
    for (var key in totalCounts) {
        totalCounts[key] = 0;
    }
    categoryCounts = {};
    dailyCounts = {};
    weekdayCounts = {};
    hourlyCounts = {};
    totalEvents = 0;
    res.send("counters have been cleared");
});

app.listen(port, () => console.log(`listening on port ${port}`));
