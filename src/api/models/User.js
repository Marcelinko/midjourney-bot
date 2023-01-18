export default class Job {
    constructor(id, display_name, email) {
        this.id = id;
        this.display_name = display_name,
        this.email = email;
    }
    setStatus(status) {
        this.status = status;
    }
}