var lat = 0;
var lng = 0;
var ISSPosition = { lat, lng };
var date_time_utc;

var marker;
var myMap;
var peopleInISS = [];

var location_div;
var current_time_div;
var total_amount_div;

var getPeopleInSpaceRequest;
var getLocationNowRequest;

window.onload = function(e) {
    location_div = document.getElementById('location');
    current_time_div = document.getElementById('current-time');
    total_amount_div = document.getElementById('total-amount');

    getPeopleInSpaceRequest = new XMLHttpRequest();
    getLocationNowRequest = new XMLHttpRequest();

    //чтоб не пришлось долго ждать, пока отобразятся новые данные, 
    //сделаем запросы на сервер и через секунду(даем время прийти ответу) отображаем полученные данные
    getLocationNow();
    getPeopleInSpace();
    setTimeout(showISSInfo, 1000);
}

//функция для инициализации карты
function initMap() {
    myMap = new google.maps.Map(document.getElementById('map'), {
        zoom: 1,
        center: ISSPosition
    });

    marker = new google.maps.Marker({
        position: ISSPosition,
        map: myMap,
        draggable: false,
        animation: google.maps.Animation.DROP,
    });
}

//получаем текущие координаты МКС и текущее время каждые 5 секунд
setInterval(getLocationNow, 5000);

//получаем текущую численность и состав МКС каждые 5 секунд
setInterval(getPeopleInSpace, 5000);

//отображаем полученные данные
setInterval(showISSInfo, 5000);

//создаем маркер и устанавливаем его свойства
function createMarker() {
    var title = 'ISS is now located at:\n' + 'longitude: ' + ISSPosition.lng + ', ' + 'latitude: ' + ISSPosition.lat;
    var marker = new google.maps.Marker({
        position: ISSPosition,
        map: myMap,
        draggable: false,
        title: title
    });
    return marker;
}

//отображаем полученную информацию
function showISSInfo() {
    marker.position = ISSPosition;
    marker.setMap(null);
    marker = createMarker();

    location_div.innerHTML = '<b>ISS is now located at:</b><br> longitude: ' + ISSPosition.lng + ', latitude: ' + ISSPosition.lat;
    current_time_div.innerHTML = '<b>Current UTC time:</b><br> ' + date_time_utc;
    total_amount_div.innerHTML = 'Total amount: ' + peopleInISS.length + ' people in ISS';

    //удаляем элементы удовлетворяющие селектору
    var parent = document.getElementsByClassName('people-info')[0];
    var children = document.querySelectorAll('.people-info .people-info-item');
    for (var i = 0; i < children.length; i++) {
        parent.removeChild(children[i]);
    }

    //добавляем элементы с именами членов экипажа МКС
    var copied_item = document.getElementsByClassName('people-info-item')[0];
    for (var i = 0; i < peopleInISS.length; i++) {
        var clone = copied_item.cloneNode(true);
        clone.style.display = '';
        clone.childNodes[3].innerHTML = peopleInISS[i].name;
        parent.appendChild(clone);
    }
}

//для конвертации UNIX timestamp в UTC
function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    if (sec < 10) {
        sec = '0' + sec;
    }
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}

//запрос для получения текущих координат и времени
function getLocationNow() {
    getLocationNowRequest.onreadystatechange = function() {
        if (getLocationNowRequest.readyState != 4) return;
        if (getLocationNowRequest.status != 200) {
            console.log(getLocationNowRequest.status + ': ' + getLocationNowRequest.statusText);
        } else {
            var responseObj = JSON.parse(getLocationNowRequest.responseText);
            lat = parseFloat(responseObj.iss_position.latitude);
            lng = parseFloat(responseObj.iss_position.longitude);
            ISSPosition = { lat, lng };
            date_time_utc = timeConverter(responseObj.timestamp);
        }
    }
    getLocationNowRequest.open('GET', 'http://api.open-notify.org/iss-now.json', true);
    getLocationNowRequest.send();
};

//запрос для получения текущей численности и состава МКС  
function getPeopleInSpace() {
    getPeopleInSpaceRequest.onreadystatechange = function() {
        if (getPeopleInSpaceRequest.readyState != 4) return;
        if (getPeopleInSpaceRequest.status != 200) {
            console.log(getPeopleInSpaceRequest.status + ': ' + getPeopleInSpaceRequest.statusText);
        } else {
            var responseObj = JSON.parse(getPeopleInSpaceRequest.responseText);
            peopleInISS = [];
            for (var i = 0; i < responseObj.people.length; i++) {
                if (responseObj.people[i].craft == 'ISS') {
                    peopleInISS.push(responseObj.people[i]);
                }
            }
        }
    }
    getPeopleInSpaceRequest.open('GET', 'http://api.open-notify.org/astros.json', true);
    getPeopleInSpaceRequest.send();
};