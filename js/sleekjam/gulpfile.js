var browserify = require('browserify');
var gulp = require('gulp');
var source = require("vinyl-source-stream");
var reactify = require('reactify');
var browserSync = require('browser-sync');



gulp.task('compile', function(){
  var b = browserify();
  b.transform(reactify); // use the reactify transform
  b.add('./main.js');
  return b.bundle()
    .pipe(source('./main.js'))
    .pipe(gulp.dest('./dist'));
});


// start server
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: "./"
        }
    });
});

// use default task to launch BrowserSync and watch JS files
gulp.task('default', ['browser-sync'], function () {

    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
    gulp.watch(["*.jsx", "*.js", "index.html", "app.css"], ['compile', browserSync.reload]);
});