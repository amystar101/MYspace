
// function to retrive information from the server
function get_data(message){
    let xhttp = new XMLHttpRequest();
    let parent = document.getElementById("parent");

    if(message){
        let msg = document.getElementById("msg");
        msg.innerText = message;
    }


    xhttp.onreadystatechange = function(){
        if(this.status == 200 && this.readyState == 4){
            let newdata = this.response;
            newdata = JSON.parse(newdata);
            parent.innerHTML = "";
            for(let i = 0;i<newdata.length;i++){

                let newchild = document.createElement("li");
                let share = "<button onclick='myshare(\""+newdata[i]._id+"\")'>get shareable link</button>"
                let unshare = "<button id = '"+newdata[i]._id+"unshare' onclick='myunshare(\""+newdata[i]._id+"\")'>unshare</button>"
                let button = "<form method='POST' action='/data/delete/"+newdata[i]._id+"?_method=DELETE'><button>Remove</button></form>";
                let strHtml = "<a class='listItem' href = '/data/download/"+newdata[i]._id+"'>"+newdata[i].name+"</a>"+button+share+unshare;
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

// function to upload data as chunk
function chunk_upload(file,size,chunk_size,start,end,chunk_no,name,F){
    // creating the chunk peice
    let piece = {
        chunk_no : chunk_no,
        chunk : file,
        name : name,
        end  : end == size
    };
    // Ajax request
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){

            res = JSON.parse(this.response);
            // console.log(res);

            if(res.required != -2){
                // chunk uploaded , update the loading
                progressUpdate(end,size);
            }

            if(res.required == -1){
                get_data("Uploaded Successfully");
            }
            else if(res.required == -2){
                get_data("Uploaded failed due to some reason");
            }
            else{
                end = res.required*chunk_size;
                start = res.required*chunk_size;
                if(end + chunk_size > size)
                    end = size;
                else
                    end += chunk_size;
                
                // reading the file part
                let file_part = F.slice(start,end);
                let reader = new FileReader();
                reader.onload = function(e){
                    chunk_upload(e.target.result,size,chunk_size,start,end,res.required,name,F);
                }
                reader.readAsBinaryString(file_part);
            }
        }
    }
    xhttp.open("POST","/data",true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(piece));

}

// function to process data before upload as chunk
function myupload(){
    let data = document.getElementById("data");
    let file = data.files[0];
    let msg = document.getElementById("msg");
    if(!file){
        msg.innerText = "ERROR";
        return;
    }
    else{
        msg.innerText = "UPLOADING..."; 
    }
    let size = file.size,chunk_size = 1000000,start = 0;
    let end = start+chunk_size;
        if(end > size)
            end = size;
    let file_part = file.slice(start,end);
    let reader = new FileReader();
    reader.onload = function(e){
        chunk_upload(e.target.result,size,chunk_size,0,end,0,file.name,file);
    }
    reader.readAsBinaryString(file_part);
};

// function to share the data
function myshare(id){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.status == 200 && this.readyState == 4){
            let alt = 'Shareable Link = "';
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

// function to unshare the data
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

// function to handle progress events
function progressUpdate(uploaded,size){
    let progressFill = document.getElementById("progressFill");
    let progressBar = document.querySelector(".progressBar");
    let percentage = document.getElementById("percentage");
    let percent = Math.round((uploaded*100)/size);

    percentage.innerText = percent+" %";
    progressFill.style.width = percent+"%";

    return;
}





get_data();
