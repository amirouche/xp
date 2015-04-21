var browserify = require('browserify');
var gulp = require('gulp');
var sass = require('gulp-sass');
var source = require("vinyl-source-stream");
var reactify = require('reactify');
var browserSync = require('browser-sync');
var del = require('del');
var notify = require("gulp-notify");
var nodemon = require('gulp-nodemon')
 
gulp.task('server', function () {
    nodemon({
        script: 'server.js',
	ignore: ['*.*']
    });
});


function onError(error) {
    notify().write('jsx error ' + error);
    console.log(error);
}

gulp.task('js', function(){
    /* return the stream for browser-sync */
    return browserify('./src/js/app.js')
	.transform(reactify, {es6: true, onError: onError})
	.bundle()
	.pipe(source('bundle.js'))
	.pipe(gulp.dest('./dist'));
});


gulp.task('clean', function () {
    /* remove emacs files */
    del([
	'src/js/.*',
	'src/js/*~',
	'src/css/.*',
	'src/css/*~',
    ]);
});


gulp.task('css', function () {
    return gulp.src('./src/css/*.scss')
        .pipe(sass({
            errLogToConsole: false,
            onError: function(err) { return notify().write(err);}
	}))
	.pipe(gulp.dest('./dist/'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('fonts', function() {
    return gulp.src(['src/fonts/*']).pipe(gulp.dest('dist/'));
});

gulp.task('img', function() {
    return gulp.src(['src/img/*']).pipe(gulp.dest('dist/'));
});


gulp.task('default', ['clean', 'img', 'fonts', 'js', 'css', 'server'], function () {
    gulp.watch(['src/css/*.css', "src/css/*.scss"], ['css']);
    gulp.watch(['src/img/*', "src/js/*.jsx", "src/js/*.js", "index.html"], ['clean', 'img', 'fonts', 'js', 'css']);
});
