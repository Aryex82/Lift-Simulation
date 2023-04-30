

const liftPositions = [];
const TIME_PER_FLOOR = 2000;
const TIME_DOOR = 2500;
const BASE_URL = "http://localhost:8080";
const singlePlayerFlow = [0,1];
const multiPlayerNewRoom = [0,2,3,1];
const multiPlayerJoinRoom = [0,2,3,4];
let invalidInputs = [];
let tabFlow = [];
let currentTabIndex = 0;
let details = {floors : null, lifts : null, playersName : null, playerId : null, roomId : null, type : null , isMulti : null};

document.addEventListener("DOMContentLoaded", function(event){

  if(event.target.baseURI.includes("lift-simulation.html")){

        details = JSON.parse(sessionStorage.getItem('gameDetails'));

        if(details.isMulti){
            subscribeToUpdates();
        }
        constructPage(details.floors,details.lifts);
        console.log(liftPositions);
    }
    else {


        tabFlow = singlePlayerFlow;
        showTab(tabFlow[currentTabIndex]);
        const screenWidth = screen.availWidth;
        let liftInput = document.getElementById('liftNum');
        if(screenWidth < 400){
            liftInput.setAttribute("max","2");
        }
        else if(screenWidth < 600){
            liftInput.setAttribute("max","3");

         }else if(screenWidth < 800){
                        liftInput.setAttribute("max","4");
        }
        else{
            liftInput.setAttribute("max",screenWidth/190);
        }
    }
});

async function finalSubmit(event){

    event.preventDefault();

    if(event.srcElement.id === "joinRoom"){
        details.roomId = event.target.elements['roomId'].value;
        data = await joinRoomRequest();
        details.floors = data.numberOfFloors;
        details.lifts = data.numberOfLifts;
        details.playerId = data.playerId;
        loadLiftsPage(details.floors,details.lifts);    
    } else
    {
        const form = event.target;
        details.floors = form.elements['floorNum'].value;
        details.lifts = form.elements['liftNum'].value;
    
    if(details.type != "single")
    {
        data = await createRoomRequest();
        details.roomId = data.roomId;
        details.playerId = data.playerId;
        loadLiftsPage(details.floors,details.lifts);                
    }else{
        loadLiftsPage(details.floors,details.lifts);
    }
        console.log(details);
        return false;
    }
}


let stompClient = null;

  const connect = () => {

    SockJS = new SockJS(BASE_URL+"/ws");
    stompClient = Stomp.over(SockJS);
    this.stompClient = stompClient;
    stompClient.connect({}, () =>{
    console.log("connected");

    stompClient.subscribe(
      "/game/" + details.roomId+ "/queue/messages",
      onMessageReceived
    );
    });

  };

  const onMessageReceived = (message) => {
        console.log(message);
        const data = JSON.parse(message.body);
        console.log(data);
        if(data.playerDetails.playerId != details.playerId){
            document.getElementById(data.command.buttonId).click();
        }
        console.log("received");
}


  const sendMessage = (button) => {
    
      const message = {
        roomId :  details.roomId,
        playerId : details.playerId,
        command : {
            buttonId : button.id
        }
      };
        
      this.stompClient.send("/app/command", {}, JSON.stringify(message));
  };

 function subscribeToUpdates(){

    console.log("subscribing");
    connect();
    console.log("subscribed");
}


async function joinRoomRequest(){
    const payload = {
    roomId:details.roomId,
    playersDetails : {
        playerName:details.playersName
    }
};

try {
    const response = await fetch(BASE_URL+"/join", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json", // set the Content-Type header to application/json
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function createRoomRequest(){
    const payload = {
  numberOfFloors: details.floors,
  numberOfLifts: details.lifts,
  adminName: details.playersName,
};

try {
    const response = await fetch(BASE_URL+"/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // set the Content-Type header to application/json
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

function next(type,event){
    if(event != null){
        event.preventDefault();
        console.log(event);
    }
    details.type = type;
    if(type === "single"){
        details.isMulti = false;
        tabFlow = singlePlayerFlow;
    }else if(type === 'multi' || type == 'join'){
        details.isMulti = true;
        tabFlow = multiPlayerJoinRoom;
    }else if(type === 'create'){
        tabFlow = multiPlayerNewRoom;
    }else if(type === 'name'){
        details.playersName = event.target.elements['name'].value;
    }
    hideTab(tabFlow[currentTabIndex]);
    showTab(tabFlow[++currentTabIndex]);
}

function prev(){
    hideTab(tabFlow[currentTabIndex]);
    showTab(tabFlow[--currentTabIndex]);
    for(let i = 0; i <  invalidInputs.length; i++){
        invalidInputs[i].classList.remove("invalid");
        invalidInputs.splice(i,1);
    }
}
    

function loadLiftsPage(floors,lifts) {
    sessionStorage.setItem('gameDetails',JSON.stringify(details));
    window.location.href = "../src/pages/lift-simulation.html";
}


function showTab(n) {
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";
}
function hideTab(n) {
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "none";
}


function singlePlayerForm(event){
      var x = document.getElementsByClassName("tab");
      console.log(x);
  x[0].style.display = "none";

  x[1].style.display = "block";


}


function toggleElementsHide(className, hide){
    var d1Elements = document.getElementsByClassName(className);
    console.log(d1Elements);
    if(hide){
        for(let i = 0; i < d1Elements.length; i++){
            d1Elements[i].setAttribute("hidden",true);
        }
    }else{
    for(let i = 0; i < d1Elements.length; i++){
        d1Elements[i].removeAttribute("hidden");

    }
    }

}

function constructPage(floors,lifts){

    var topFloorDom = document.querySelector("#top-floor");

    var groundFloorDom = document.querySelector("#ground-floor");

    var topFloorWrapper = topFloorDom.getElementsByClassName("floor-wrapper")[0];
    var groundFloorWrapper = groundFloorDom.getElementsByClassName("floor-wrapper")[0];
    var topFloorUnit = topFloorWrapper.getElementsByClassName("floor")[0];
    var groundFloorUnit = groundFloorWrapper.getElementsByClassName("floor")[0];
    var upButton = groundFloorDom.getElementsByClassName("up-button")[0];
    var downButton = topFloorDom.getElementsByClassName("down-button")[0];
    const buildingContainer = document.getElementsByClassName('building')[0];

liftPositions.push({position : 0, availableFrom : Date.now(), id : "lift-0" });
    for(var i =1; i < lifts ; i++){
        topFloorWrapper.appendChild(topFloorUnit.cloneNode(true));
        var groundClone = groundFloorUnit.cloneNode(true);
        const liftId = "lift-"+i;
        groundClone.querySelector("#lift-0").setAttribute("id",liftId);
        liftPositions.push({position : 0, availableFrom : Date.now() ,id :liftId});
        groundFloorWrapper.appendChild(groundClone);
    }
    

    // downButton.removeAttribute("onclick");
    downButton.setAttribute("onclick", "getLift("+(floors-1)+",event)");
    downButton.setAttribute("id", "lift-down-"+(floors-1));
    for(var i = floors - 2; i >0 ; i--){
        var topClone = topFloorDom.cloneNode(true);
        const liftMethod = "getLift("+i+",event)";
        const upId = "lift-up-"+i;
        const downId = "lift-down-"+i;
        var upButtonClone =  upButton.cloneNode(true)
        upButtonClone.setAttribute("onclick", liftMethod);
        upButtonClone.setAttribute("id", upId);
        let downButton = topClone.getElementsByClassName("down-button")[0];
        downButton.setAttribute("onclick",liftMethod);
        downButton.setAttribute("id",downId);
        topClone.getElementsByClassName("floor-buttons")[0].appendChild(upButtonClone);
        buildingContainer.insertBefore(topClone,groundFloorDom);
    }

}


function waitForLiftAndMove(floor,event,lift){
    setTimeout(() => {const button = event.target;
    moveLift(lift.id,Math.abs(lift.position - floor), (lift.position - floor) < 0,button);
    },Math.max(0,lift.availableFrom - Date.now()));
}
function findNearestLift(floor,event){
    let nearestLift = null;
    let nearestLiftDistance = undefined;
    let minAvailableTime = Number.MAX_VALUE;
    for(let i = 0; i < liftPositions.length; i++){
        // if(liftPositions[i].position == floor){
        //     waitForLiftAndMove(floor,event,liftPositions[i]);
        //     return null;
        // }
        let distance = Math.abs(liftPositions[i].position - floor);
        if(liftPositions[i].availableFrom < Date.now()){
            if(nearestLiftDistance == undefined || distance < nearestLiftDistance){
                nearestLiftDistance = distance;
                nearestLift = liftPositions[i];
            }
        }
        minAvailableTime = Math.min(minAvailableTime,liftPositions[i].availableFrom);
    }

    if(nearestLift == null) {
        setTimeout(() => {console.log("Waited for lift");
            getLift(floor,event)}, minAvailableTime - Date.now());
    }

    else nearestLift.availableFrom = Date.now() + (TIME_PER_FLOOR * nearestLiftDistance) + (TIME_DOOR * 2);
    console.log(nearestLift);
    console.log(liftPositions);

    return nearestLift;
}



function getLift(floor,event){

    const button = event.target;

    if(details.isMulti){
        sendMessage(button);
    }
    console.log(button.onclick);
    button.disabled = true;
    let lift = findNearestLift(floor,event);

    if(lift != null)
    {
        moveLift(lift.id,Math.abs(lift.position - floor), (lift.position - floor) < 0,button);
        lift.position = floor;
    }
    
}

    const floorBeam = document.getElementsByClassName("floor-beam")[0];
    const floor = document.getElementsByClassName("floor")[0];

function moveLift(id,floors,isUp,button){
    const objImage = document.getElementById(id);

    var travelPerFloor = (floor.clientHeight + floorBeam.clientHeight) * floors;
    objImage.style.transitionDuration = ((floors * TIME_PER_FLOOR ) /1000)+ "s";
    setTimeout(() => {doorsAnimation(objImage,button)}, (floors * TIME_PER_FLOOR ));
    console.log(objImage);
    if(objImage.style.top ==="") objImage.style.top = "0px";
        
    if(isUp){
        objImage.style.top = ((parseInt(objImage.style.top)) - travelPerFloor) + "px";
    }else{
        objImage.style.top = ((parseInt(objImage.style.top)) + travelPerFloor) + "px";
    }
}

function doorsAnimation(objImage,button){
        const liftDoor1 = objImage.getElementsByClassName("lift-door")[0];
        const liftDoor2 = objImage.getElementsByClassName("lift-door")[1];
        var width = liftDoor1.clientWidth;
        liftDoor1.style.width = "0px";
        liftDoor2.style.width = "0px";
        setTimeout(() => { 
            liftDoor1.style.width = width+"px";
            liftDoor2.style.width = width+"px"; 
            setTimeout(() => {button.disabled = false; },TIME_DOOR);
    }, TIME_DOOR);

}
