

function myupload(){
    let data = document.getElementById("data");
    let file = data.files[0];
    let msg = document.getElementById("msg");
    if(!file){
        msg.innerText = "ERROR";
        return;
    }
    let parent = document.getElementById("parent");
    let formdata = new FormData();
    formdata.append("file",file);
    msg.innerText = "UPLOADING.......";
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            let newdata = this.response;
            newdata = JSON.parse(newdata);
            console.log(this.response,newdata);
            let newchild = document.createElement("li");
            let share = "<button onclick='myshare(\""+newdata._id+"\")'>get shareable link</button>"
            let unshare = "<button id = '"+newdata._id+"unshare' onclick='myunshare(\""+newdata._id+"\")'>unshare</button>"
            let button = "<form method='POST' action='/data/delete/"+newdata._id+"?_method=DELETE'><button>Remove</button></form>";
            let strHtml = "<a href = '/data/download/"+newdata._id+"'>"+newdata.name+"</a>"+button+share+unshare;
            newchild.innerHTML = strHtml;
            parent.appendChild(newchild);
            if(newdata.shairing == false){
                let idElement = newdata._id+"unshare"; 
                let buttonElement = document.getElementById(idElement);
                buttonElement.style.display = "none"
            }
            let br = document.createElement('br');
            parent.appendChild(br);
        }
    };
    xhttp.open("POST","/data",true);
    xhttp.send(formdata);
};


function get_data(){
    let xhttp = new XMLHttpRequest();
    let parent = document.getElementById("parent");
    xhttp.onreadystatechange = function(){
        if(this.status == 200 && this.readyState == 4){
            let newdata = this.response;
            newdata = JSON.parse(newdata);
            // console.log(newdata.length);
            // console.log(newdata);
            for(let i = 0;i<newdata.length;i++){
                let newchild = document.createElement("li");
               let share = "<button onclick='myshare(\""+newdata[i]._id+"\")'>get shareable link</button>"
               let unshare = "<button id = '"+newdata[i]._id+"unshare' onclick='myunshare(\""+newdata[i]._id+"\")'>unshare</button>"
                let button = "<form method='POST' action='/data/delete/"+newdata[i]._id+"?_method=DELETE'><button>Remove</button></form>";
                let strHtml = "<a href = '/data/download/"+newdata[i]._id+"'>"+newdata[i].name+"</a>"+button+share+unshare;
                newchild.innerHTML = strHtml;
                parent.appendChild(newchild);
                if(newdata[i].shairing == false){
                    let idElement = newdata[i]._id+"unshare"; 
                    let buttonElement = document.getElementById(idElement);
                    buttonElement.style.display = "none"
                }
                let br = document.createElement('br');
                parent.appendChild(br);
            }
        }
    }
    xhttp.open("GET","/data",true);
    xhttp.send();
}

function myshare(id){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.status == 200 && this.readyState == 4){
            let alt = 'Shareable Linl = "';
            alt =alt+ this.response + '"';
            let idElement = id+"unshare"; 
            let button = document.getElementById(idElement);
            button.style.display = "inline"
            alert(alt);
        }
    }
    xhttp.open("GET","/data/"+id+"/share",true);
    xhttp.send();


}

function myunshare(id){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.status == 200 && this.readyState == 4){
            alert(this.response);
            let idElement = id+"unshare"; 
            let button = document.getElementById(idElement);
            button.style.display = "none"

        }
    }
    xhttp.open("GET","/data/"+id+"/unshare",true);
    xhttp.send();


}


get_data();
