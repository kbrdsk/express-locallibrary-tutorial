const Genre = require("../models/genre");
const Book = require("../models/book");
const validator = require("express-validator");

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
	Genre.find().then(
		(genre_list) =>
			res.render("genre_list", { title: "Genre List", genre_list }),
		(error) => next(error)
	);
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
	Promise.all([
		Genre.findById(req.params.id),
		Book.find({ genre: req.params.id }),
	]).then(
		([genre, genre_books]) => {
			if (genre === null) {
				const error = new Error("Genre not found");
				error.status = 404;
				return next(error);
			}

			res.render("genre_detail", {
				title: "Genre Detail",
				genre,
				genre_books,
			});
		},
		(error) => next(error)
	);
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res) {
	res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
	validator.body("name", "Genre name required").trim().isLength({ min: 1 }),
	validator.sanitizeBody("name").escape(),
	(req, res, next) => {
		const errors = validator.validationResult(req);
		const genre = new Genre({ name: req.body.name });
		if (!errors.isEmpty()) {
			res.render("genre_form", {
				title: "Create Genre",
				genre,
				errors: errors.array(),
			});
			return;
		} else {
			Genre.findOne({ name: req.body.name }).then(
				(found_genre) => {
					if (found_genre) res.redirect(found_genre.url);
					else {
						genre.save().then(
							() => res.redirect(genre.url),
							(error) => next(error)
						);
					}
				},
				(error) => next(error)
			);
		}
	},
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
	Promise.all([
		Genre.findById(req.params.id),
		Book.find({ genre: req.params.id }),
	]).then(([genre, genre_books]) => {
		if (genre === null) res.redirect("/catalog/genres");
		res.render("genre_delete", {
			title: "Delete Genre",
			genre,
			genre_books,
		});
	}, next);
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
	Promise.all([
		Genre.findById(req.body.genreid),
		Book.find({ genre: req.body.genreid }),
	]).then(([genre, genre_books]) => {
		if (genre_books.length > 0) {
			res.render("genre_delete", {
				title: "Delete Genre",
				genre,
				genre_books,
			});
		} else {
			Author.findByIdAndRemove(req.body.genreid).then(
				() => res.redirect("/catalog/genres"),
				next
			);
		}
	});
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res) {
	Genre.findById(req.params.id).then((genre) => {
		if (genre === null) {
			const error = new Error("Genre not found");
			error.status = 404;
			next(error);
		}
		res.render("genre_form", { title: "Update Genre", genre });
	});
};

// Handle Genre update on POST.
exports.genre_update_post = [
	validator.body("name", "Genre name required").trim().isLength({ min: 1 }),
	validator.sanitizeBody("name").escape(),
	(req, res, next) => {
		const errors = validator.validationResult(req);
		const genre = new Genre({ name: req.body.name, _id: req.params.id });
		if (!errors.isEmpty()) {
			res.render("genre_form", {
				title: "Update Genre",
				genre,
				errors: errors.array(),
			});
			return;
		} else {
			Genre.findOne({ name: req.body.name }).then(
				(found_genre) => {
					if (found_genre) {
						const error = new Error("Genre exists");
						error.msg = "A Genre with that name already exists.";
						res.render("genre_form", {
							title: "Update Genre",
							genre,
							errors: [error],
						});
					} else {
						Genre.findByIdAndUpdate(req.params.id, genre, {}).then(
							(thegenre) => res.redirect(thegenre.url),
							next
						);
					}
				},
				(error) => next(error)
			);
		}
	},
];
