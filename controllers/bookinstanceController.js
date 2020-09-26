const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
	BookInstance.find()
		.populate("book")
		.then(
			(bookinstance_list) =>
				res.render("bookinstance_list", {
					title: "Book Instance List",
					bookinstance_list,
				}),
			(error) => next(error)
		);
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
	BookInstance.findById(req.params.id)
		.populate("book")
		.then(
			(bookinstance) => {
				if (bookinstance === null) {
					const error = new Error("Book copy not found");
					error.status = 404;
					return next(error);
				}

				res.render("bookinstance_detail", {
					title: `Copy: ${bookinstance.book.title}`,
					bookinstance,
				});
			},
			(error) => next(error)
		);
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
	Book.find({}, "title").then(
		(book_list) =>
			res.render("bookinstance_form", {
				title: "Create BookInstance",
				book_list,
			}),
		next
	);
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
	//validation
	body("book", "Book must be specified").trim().isLength({ min: 1 }),
	body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }),
	body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

	//sanitization
	sanitizeBody("book").escape(),
	sanitizeBody("imprint").escape(),
	sanitizeBody("status").trim().escape(),
	sanitizeBody("due_back").toDate(),

	(req, res, next) => {
		const errors = validationResult(req);
		const bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back,
		});

		if (!errors.isEmpty()) {
			Book.find({}, "title").then((book_list) => {
				res.render("bookinstance_form", {
					title: "Create BookInstance",
					book_list,
					selected_book: bookinstance.book._id,
					errors: errors.array(),
					bookinstance,
				});
				return;
			}, next);
		} else {
			bookinstance
				.save()
				.then(() => res.redirect(bookinstance.url), next);
		}
	},
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
	BookInstance.findById(req.params.id)
		.populate("book")
		.then((bookinstance) => {
			if (bookinstance === null) res.redirect("/catalog/bookinstances");
			else
				res.render("bookinstance_delete", {
					title: "Delete Copy",
					bookinstance,
				});
		});
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
	BookInstance.findById(req.body.bookinstanceid)
		.populate("book")
		.then((bookinstance) => {
			BookInstance.findByIdAndRemove(req.body.bookinstanceid).then(
				() => res.redirect("/catalog/bookinstances"),
				next
			);
		});
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
	Promise.all([
		BookInstance.findById(req.params.id).populate("book"),
		Book.find({}, "title"),
	]).then(([bookinstance, book_list]) => {
		if (bookinstance === null) {
			const error = new Error("Book Instance not found");
			error.status = 404;
			next(error);
		}
		res.render("bookinstance_form", {
			title: "Update BookInstance",
			bookinstance,
			book_list,
		});
	});
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
	//validation
	body("book", "Book must be specified").trim().isLength({ min: 1 }),
	body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }),
	body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

	//sanitization
	sanitizeBody("book").escape(),
	sanitizeBody("imprint").escape(),
	sanitizeBody("status").trim().escape(),
	sanitizeBody("due_back").toDate(),

	(req, res, next) => {
		const errors = validationResult(req);
		const bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back,
			_id: req.params.id,
		});

		if (!errors.isEmpty()) {
			Book.find({}, "title").then((book_list) => {
				res.render("bookinstance_form", {
					title: "Update BookInstance",
					book_list,
					selected_book: bookinstance.book._id,
					errors: errors.array(),
					bookinstance,
				});
				return;
			}, next);
		} else {
			BookInstance.findByIdAndUpdate(
				req.params.id,
				bookinstance,
				{}
			).then((theinstance) => res.redirect(theinstance.url), next);
		}
	},
];
