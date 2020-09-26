const moment = require("moment");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
	first_name: { type: String, required: true, maxlength: 100 },
	family_name: { type: String, required: true, maxlength: 100 },
	date_of_birth: { type: Date },
	date_of_death: { type: Date },
});

AuthorSchema.virtual("name").get(function () {
	return this.first_name && this.family_name
		? `${this.first_name} ${this.family_name}`
		: "";
});

AuthorSchema.virtual("url").get(function () {
	return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("lifespan").get(function () {
	return `${format(this.date_of_birth)} - ${format(this.date_of_death)}`;
});

AuthorSchema.virtual("date_of_birth_formatted").get(function () {
	return format(this.date_of_birth)
});

AuthorSchema.virtual("date_of_death_formatted").get(function () {
	return format(this.date_of_death)
});

function format(date) {
	return date ? moment(date).format("YYYY-MM-DD") : "";
}

module.exports = mongoose.model("Author", AuthorSchema);
