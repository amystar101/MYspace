

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
            let newchild = document.createElement("li");
            let button = "<a href = 'delete/"+file.name+"' class = 'remove btn btn-danger'>Remove <\a>";
            newchild.classList.add("data");

            newchild.innerHTML = "<a href = 'download/"+file.name+"' class = 'data'>"+ file.name+"<\a>"+button;
            parent.appendChild(newchild);
            let br = document.createElement('br');
            parent.appendChild(br);
            msg.innerText = "UPLOADED :)";
        }
    };
    xhttp.open("POST","/upload",true);
    xhttp.send(formdata);
};


