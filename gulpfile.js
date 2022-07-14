/*
 File started with https://goo.gl/Vv02w2 (Fast browserify builds with watchify)
 */
'use strict';

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var concat = require('gulp-concat');
var order = require('gulp-order');
var sass = require('gulp-sass')(require('sass'));
var concat_css = require('gulp-concat-css');
var minify_css = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var notify = require('gulp-notify');
var mocha = require('gulp-mocha');
var stripDebug = require('gulp-strip-debug');

// add custom browserify options here
var customOpts = {
    entries: ['./js/app.js'],//application entry point,
    /* add path to have absolute paths when requiring modules
     * to avoid ../../../../ stuff
     */
    paths: ['./node_modules', './js/app_modules'],
    debug: true
};

var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

// Concatenate vendor js files
gulp.task('vendor-js', function () {
    return gulp.src(['./js/vendor/*.js'])
        .pipe(order([
            'jquery-2.1.4.min.js',
            'jquery-ui.min.js',
            //'jquery-ui-touch-punch.js',
            '*.js'
        ]))
        .pipe(concat('vendor-formbuilder.js'))
        // .pipe(uglify())
        .pipe(gulp.dest('./public/js/'));
});

gulp.task('watch', gulp.series(bundle)); // so you can run `gulp watch` to build the file
b.on('update', gulp.series(bundle)); // on any dep update, runs the bundler
b.on('log', gulp.series(gutil.log)); // output build logs to terminal

function bundle() {

    //watch sass file and compile
    gulp.watch('./css/sass/*.scss', gulp.series('sass'));

    //watch paper sass file and compile
    gulp.watch('./css/paper/*.scss', gulp.series('vendor-css'));

    return b.bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('formbuilder.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({ loadMaps: true })) // loads map from browserify file
        // Add transformation tasks to the pipeline here.

        .pipe(sourcemaps.write('./')) // writes .map file
        //.pipe(uglify())
        //.pipe(header('//Build number: ' + Date.now() + '\n\n'))
        .pipe(gulp.dest('./public/js/'));

}

//concat vendor css
gulp.task('vendor-css', async function () {
    //compile bootstrap material (paper theme)
    gulp.src('./css/paper/bootstrap-material.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(minify_css({ compatibility: 'ie8' }))
        .pipe(gulp.dest('./css/vendor/'));

    gulp.src('./css/vendor/*.css')
        .pipe(concat_css('vendor-formbuilder.css'))
        .pipe(minify_css({ compatibility: 'ie8' }))
        //.pipe(header('//Build number: ' + Date.now() + '\n\n'))
        .pipe(gulp.dest('./public/css/'));
});

//compile sass to css
gulp.task('sass', async function compileSass() {
    gulp.src('./css/sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(minify_css({ compatibility: 'ie8' }))
        // .pipe(header('/* Build number: ' + Date.now() + '*/\n\n'))
        .pipe(gulp.dest('./public/css/'));
});



//to be used with npm run, as this task does not use watchify
gulp.task('browserify', function () {
    return browserify(opts)
        .bundle()
        .pipe(source('formbuilder.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write())
        .pipe(uglify())
        .pipe(stripDebug())
        .pipe(header('//Build number: ' + Date.now() + '\n\n'))
        .pipe(gulp.dest('./public/js/'));
});

//to be used with npm run, as this task does not use watchify
gulp.task('debug', function () {
    return browserify(opts)
        .bundle()
        .pipe(source('formbuilder.js'))
        .pipe(buffer())
        //.pipe(sourcemaps.init({loadMaps: true}))
        //.pipe(sourcemaps.write())
        // .pipe(uglify())
        // .pipe(stripDebug())
        .pipe(header('//Build number: ' + Date.now() + '\n\n'))
        .pipe(gulp.dest('./public/js/'));
});

// Default Task to be used when using gulp
gulp.task('default', gulp.series('vendor-js', 'vendor-css', 'sass', 'browserify'));

/*****************************************************************************************/
//tests
// add custom browserify options here
var testOpts = {
    entries: ['./js/test.js'],//test entry point,
    /* add path to have absolute paths when requiring modules
     * to avoid ../../../../ stuff
     */
    paths: ['./node_modules', './js/app_modules', './js/test'],
    debug: true
};

var test_opts = assign({}, watchify.args, testOpts);
var b_test = watchify(browserify(test_opts));

//run test manually
gulp.task('test', function () {
    return browserify(test_opts)
        .bundle()
        // log errors if they happen
        .on('error', function (err) {
            return notify().write(err);
        })
        .pipe(source('test-bundle.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./public/test/'));
});

//build test automatically via watchify
gulp.task('watch-test', test_bundle); // so you can run `gulp test` to build the file
b_test.on('update', test_bundle); // on any dep update, runs the bundler
b_test.on('log', gutil.log); // output build logs to terminal

function test_bundle() {
    return b_test.bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Test Error'))
        .pipe(source('test-bundle.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./public/test/'));
}

gulp.task('mocha', function () {
    return gulp.src('test.js')
        .pipe(mocha())
        .once('error', function () {
            process.exit(1);
        })
        .once('end', function () {
            process.exit();
        });
});


