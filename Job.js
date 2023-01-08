const uuid = require("uuid");
export class Job{
    constructor(prompt){
        this.id = uuid.v4(),
        this.prompt = prompt,
        this.status = "",
        this.type =  "generation / upscale",//pending means it is in queue, in progress means it is being generated, completed means it is done
        this.startTime = Date.now(),
        this.endTime = Date.now(),
        this.url = ""
    }
    updateStatus(newStatus){
        this.status = newStatus;
    }

}