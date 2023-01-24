module.exports = class User {
    constructor(user_id, display_name, email) {
        this._id = user_id;
        this.display_name = display_name,
        this.email = email;
    }
}