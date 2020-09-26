const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

exports.index = function (req, res) {
	const title = "Local Library Home";
	const data = {};
	Promise.all([
		Book.countDocuments({}),
		BookInstance.countDocuments({}),
		BookInstance.countDocuments({ status: "Available" }),
		Author.countDocuments({}),
		Genre.countDocuments({}),
	]).then(
		(results) => {
			[
				data.book_count,
				data.book_instance_count,
				data.book_instance_available_count,
				data.author_count,
				data.genre_count,
			] = results;
			res.render("index", { title, data });
		},
		(error) => {
			res.render("index", { title, error, data });
		}
	);
};

// Display list of all books.
exports.book_list = function (req, res, next) {
	const title = "Book List";
	Book.find({}, "title author")
		.populate("author")
		.then(
			(book_list) => res.render("book_list", { title, book_list }),
			(error) => next(error)
		);
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
	Promise.all([
		Book.findById(req.params.id).populate("author").populate("genre"),
		BookInstance.find({ book: req.params.id }),
	]).then(
		([book, book_instances]) => {
			if (book === null) {
				const error = new Error("Book not found");
				error.status = 404;
				return next(error);
			}
			res.render("book_detail", {
				book,
				book_instances,
			});
		},
		(error) => next(error)
	);
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
	Promise.all([Author.find(), Genre.find()]).then(
		([authors, genres]) =>
			res.render("book_form", {
				title: "Create Book",
				authors,
				genres,
			}),
		next
	);
};

// Handle book create on POST.
exports.book_create_post = [
	(req, res, next) => {
		if (!(req.body.genre instanceof Array)) {
			if (typeof req.body.genre === "undefined") req.body.genre = [];
			else req.body.genre = new Array(req.body.genre);
		}
		next();
	},

	//validation
	body("title", "Title must not be empty.").trim().isLength({ min: 1 }),
	body("author", "Author must not be empty.").trim().isLength({ min: 1 }),
	body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }),
	body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }),

	//sanitization
	sanitizeBody("*").escape(),
	sanitizeBody("genre.*").escape(),

	(req, res, next) => {
		const errors = validationResult(req);
		const book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: req.body.genre,
		});
		if (!errors.isEmpty()) {
			Promise.all([Authors.find(), Genre.find()]).then(
				([authors, genres]) => {
					genres.forEach((genre) => {
						if (book.genre.includes(genre._id))
							genre.checked = "true";
					});
					res.render("book_form", {
						title: "Create Book",
						authors,
						genres,
						book,
						erros: errors.array(),
					});
					return;
				},
				next
			);
		} else {
			book.save().then(() => res.redirect(book.url), next);
		}
	},
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
	Promise.all([
		Book.findById(req.params.id).populate("author").populate("genre"),
		BookInstance.find({ book: req.params.id }),
	]).then(([book, book_instances]) => {
		if (book === null) res.redirect("/catalog/books");
		res.render("book_delete", {
			title: "Delete Book",
			book,
			book_instances,
		});
	}, next);
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
	Promise.all([
		Book.findById(req.body.bookid).populate("author").populate("genre"),
		BookInstance.find({ book: req.body.bookid }),
	]).then(([book, book_instances]) => {
		if (author_books.length > 0) {
			res.render("book_delete", {
				title: "Delete Book",
				book,
				book_instances,
			});
		} else {
			Book.findByIdAndRemove(req.body.bookid).then(
				() => res.redirect("/catalog/books"),
				next
			);
		}
	});
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
	Promise.all([
		Book.findById(req.params.id),
		Author.find(),
		Genre.find(),
	]).then(([book, authors, genres]) => {
		if (book === null) {
			const error = new Error("Book not found");
			error.status = 404;
			next(error);
		}
		genres.forEach((genre) => {
			genre.checked = book.genre.some(
				(bookGenre) => bookGenre._id.toString() === genre._id.toString()
			)
				? "true"
				: undefined;
		});
		res.render("book_form", {
			title: "Update Book",
			authors,
			genres,
			book,
		});
	});
};

// Handle book update on POST.
exports.book_update_post = [
	(req, res, next) => {
		if (!Array.isArray(req.body.genre)) {
			req.body.genre = req.body.genre ? new Array(req.body.genre) : [];
		}
		next();
	},

	//validation
	body("title", "Title must not be empty.").trim().isLength({ min: 1 }),
	body("author", "Author must not be empty.").trim().isLength({ min: 1 }),
	body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }),
	body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }),

	//sanitization
	sanitizeBody("title").escape(),
	sanitizeBody("author").escape(),
	sanitizeBody("summary").escape(),
	sanitizeBody("isbn").escape(),
	sanitizeBody("genre.*").escape(),

	(req, res, next) => {
		const errors = validationResult(req);

		const book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: req.body.genre,
			_id: req.params.id,
		});

		if (!errors.isEmpty()) {
			Promise.all([Author.find(), Genre.find()]).then(
				([authors, genres]) => {
					genres.forEach((genre) => {
						if (book.genre.includes(genre)) genre.check = "true";
					});

					res.render("book_form", {
						title: "Update Book",
						authors,
						genres,
						book,
						errors: errors.array(),
					});
				}
			);
		} else {
			Book.findByIdAndUpdate(req.params.id, book, {}).then(
				(thebook) => res.redirect(thebook.url),
				next
			);
		}
	},
];
