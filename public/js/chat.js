const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");

const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Query Search
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;
    $newMessage.scrollIntoView();
    // const newMessageStyles = getComputedStyle($newMessage);
    // const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    // const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // const visibleHeight = $messages.offsetHeight;

    // const containerHeight = $messages.scrollHeight;

    // const scrollOffset = $messages.scrollTop + visibleHeight;

    // if (containerHeight - newMessageHeight <= scrollOffset) {
    //     $messages.scrollTop = $messages.scrollHeight;
    // }
}

socket.on("message", (message) => {
    console.log(message);

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");

    const message = event.target.elements.message.value;

    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log("Message delivered!");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported in your browser!");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {

        const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        socket.emit("sendLocation", locationData, (message) => {
            $sendLocationButton.removeAttribute("disabled");
            console.log(message);
        });
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});