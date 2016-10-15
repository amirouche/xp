var browserify = require('browserify');
var gulp = require('gulp');
var sass = require('gulp-sass');
var source = require("vinyl-source-stream");
var reactify = require('reactify');
var browserSync = require('browser-sync');
var del = require('del');


gulp.task('js', function(){
  var b = browserify();
  b.transform(reactify); // use the reactify transform
  b.add('./src/js/app.js');
  return b.bundle()
    .pipe(source('./app.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('clean', function () {
  del([
      'src/js/.*',
      'src/css/.*',      
  ]);
});


gulp.task('css', function () {   
    return gulp.src('./src/css/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('fonts', function() {
    return gulp.src(['src/fonts/*']).pipe(gulp.dest('dist/'));
});

// start server
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: "./"
        }
    });
});


gulp.task('default', ['clean', 'fonts', 'js', 'css', 'browser-sync'], function () {
    gulp.watch(["src/js/*.jsx", "src/js/*.js", "index.html", "src/css/*.css", "src/css/*.scss"], ['clean', 'fonts', 'js', 'css']);
});
