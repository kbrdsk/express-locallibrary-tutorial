const Author = require("../models/author");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

// Display list of all Authors.
exports.author_list = function (req, res, next) {
	Author.find()
		.populate("author")
		.sort([["family_name", "ascending"]])
		.then(
			(author_list) =>
				res.render("author_list", {
					title: "Author List",
					author_list,
				}),
			(error) => next(error)
		);
};

// Display detail page for a specific Author.
exports.author_detail = function (req, res, next) {
	Promise.all([
		Author.findById(req.params.id),
		Book.find({ author: req.params.id }, "title summary"),
	]).then(
		([author, author_books]) => {
			if (author === null) {
				const error = new Error("Author not found");
				error.status = 404;
				return next(error);
			}

			res.render("author_detail", {
				title: "Author Detail",
				author,
				author_books,
			});
		},
		(error) => next(error)
	);
};

// Display Author create form on GET.
exports.author_create_get = function (req, res) {
	res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
	//validation
	body("first_name")
		.isLength({ min: 1 })
		.trim()
		.withMessage("First name must be specified.")
		.isAlphanumeric()
		.withMessage("First name has non-alphanumeric charactes."),
	body("family_name")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Family name must be specified")
		.isAlphanumeric()
		.withMessage("Family name has non-alphanumeric charactes."),
	body("date_of_birth", "Invalid date of birth")
		.optional({ checkFalse: true })
		.isISO8601(),
	body("date_of_death", "Invalid date of death")
		.optional({ checkFalse: true })
		.isISO8601(),

	//sanitatization
	sanitizeBody("first_name").escape(),
	sanitizeBody("family_name").escape(),
	sanitizeBody("date_of_birth").toDate(),
	sanitizeBody("date_of_death").toDate(),

	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.render("author_form", {
				title: "Create Author",
				author: req.body,
				errors: errors.array(),
			});
		} else {
			const author = new Author({
				first_name: req.body.first_name,
				family_name: req.body.family_name,
				date_of_birth: req.body.date_of_birth,
				date_of_death: req.body.date_of_death,
			});
			author.save().then(
				() => res.redirect(author.url),
				(error) => next(error)
			);
		}
	},
];

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {
	Promise.all([
		Author.findById(req.params.id),
		Book.find({ author: req.params.id }),
	]).then(([author, author_books]) => {
		if (author === null) res.redirect("/catalog/authors");
		res.render("author_delete", {
			title: "Delete Author",
			author,
			author_books,
		});
	}, next);
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, next) {
	Promise.all([
		Author.findById(req.body.authorid),
		Book.find({ author: req.body.authorid }),
	]).then(([author, author_books]) => {
		if (author_books.length > 0) {
			res.render("author_delete", {
				title: "Delete Author",
				author,
				author_books,
			});
		} else {
			Author.findByIdAndRemove(req.body.authorid).then(
				() => res.redirect("/catalog/authors"),
				next
			);
		}
	});
};

// Display Author update form on GET.
exports.author_update_get = function (req, res, next) {
	Author.findById(req.params.id).then((author) => {
		if (author === null) {
			const error = new Error("Author not found");
			error.status = 404;
			next(error);
		}
		res.render("author_form", { title: "Update Author", author });
	});
};

// Handle Author update on POST.
exports.author_update_post = [
	//validation
	body("first_name")
		.isLength({ min: 1 })
		.trim()
		.withMessage("First name must be specified.")
		.isAlphanumeric()
		.withMessage("First name has non-alphanumeric charactes."),
	body("family_name")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Family name must be specified")
		.isAlphanumeric()
		.withMessage("Family name has non-alphanumeric charactes."),
	body("date_of_birth", "Invalid date of birth")
		.optional({ checkFalse: true })
		.isISO8601(),
	body("date_of_death", "Invalid date of death")
		.optional({ checkFalse: true })
		.isISO8601(),

	//sanitatization
	sanitizeBody("first_name").escape(),
	sanitizeBody("family_name").escape(),
	sanitizeBody("date_of_birth").toDate(),
	sanitizeBody("date_of_death").toDate(),

	(req, res, next) => {
		const errors = validationResult(req);

		const author = new Author({
			first_name: req.body.first_name,
			family_name: req.body.family_name,
			date_of_birth: req.body.date_of_birth,
			date_of_death: req.body.date_of_death,
			_id: req.params.id,
		});

		if (!errors.isEmpty()) {
			res.render("author_form", {
				title: "Update Author",
				author,
				errors: errors.array(),
			});
		} else {
			Author.findByIdAndUpdate(req.params.id, author, {}).then(
				(theauthor) => res.redirect(theauthor.url),
				next
			);
		}
	},
];
