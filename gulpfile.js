var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var del = require('del');
var embedlr = require('gulp-embedlr');
var runSequence = require('run-sequence');
var rename = require('gulp-rename');
var argv = require('yargs').argv;
var changed = require('gulp-changed');
var minifyHTML = require('gulp-minify-html');
var livereload = require('gulp-livereload');
var path = require('path');
var express = require('express');
var app = express();

var isDevelopment = argv.dev;

var paths = {
    scripts: {
        lib: [
            'app/lib/jquery.min.js',
            'app/lib/angular.min.js',
            'app/lib/*.min.js'
        ],
        app: [
            'app/scripts/app.js',
            'app/scripts/**/module.js',
            'app/scripts/**/*.js'
        ]
    },
    assets: [
        'app/img/*',
        'app/font/*',
    ]
};

var lrOptions = {
    port: 1337
};

var host = {
    port: 9999
};

//Handles erros in gulp plugins
var errorHandler = function(err) {
    gutil.log(gutil.colors.red('# Error in ' + err.plugin));
    gutil.beep();
    console.log(err);
};

//Cleans up dist directory
gulp.task('clean', function() {
    return del(['dist/*']);
});

//Minifies HTML files
gulp.task('html', function() {
    function isIndexDevMode(file) {
        return (file.path == path.join(__dirname, 'app/index.html')) && isDevelopment;
    }

    return gulp.src('app/**/*.html')
        .pipe(changed('./dist'))
        .pipe(gulpif(isIndexDevMode, embedlr({
            port: lrOptions.port
        })))
        .pipe(minifyHTML({
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeCommentsFromCDATA: true,
            removeOptionalTags: true,
            conditionals: true,
            quotes: true,
            empty: true
        }))
        .pipe(gulp.dest('dist'))
        .pipe(livereload());
});

//Styles
gulp.task('styles', function() {
    return gulp.src('app/styles/**/*.scss')
        .pipe(plumber(errorHandler))
        .pipe(sourcemaps.init())
        .pipe(sass.sync({
            outputStyle: 'compressed',
            precision: 8
        }))
        .pipe(sourcemaps.write('./src-maps'))
        .pipe(gulp.dest('dist/styles'))
        .pipe(livereload());
});

//Scripts
gulp.task('scripts', function() {
    return gulp.src(paths.scripts.app)
        .pipe(sourcemaps.init())
        .pipe(plumber(errorHandler))
        .pipe(concat('app.js'))
        .pipe(sourcemaps.write('./src-maps'))
        .pipe(gulp.dest('dist/js'))
        .pipe(livereload());
});

//Concats all js libraries (angular, jquery etc)
gulp.task('scripts.lib', function() {
    return gulp.src(paths.scripts.lib)
        .pipe(concat('lib.js'))
        .pipe(gulp.dest('dist/lib'));
});

//Gulp watchers
gulp.task('watch', function() {
    livereload.listen(lrOptions.port);
    console.log('Livereload is working on port %s', lrOptions.port);

    gulp.watch('app/**/*.html', ['html']);
    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/api/**/*.json', ['api']);
    gulp.watch(paths.assets, ['assets']);

    console.log('Watchers are running');
});

//Builds the project
gulp.task('build', function() {
    runSequence('clean',
        ['html', 'scripts.lib', 'scripts', 'styles', 'api', 'assets']);
});

//Run express server
gulp.task('serve', function() {
    if (!isDevelopment) return;

    var staticFolder = path.join(__dirname, 'dist');

    app.use(express.static(staticFolder));

    app.listen(host.port, function() {
        console.log('Server started: http://localhost:' + host.port);
        return gulp;
    });
});

//Copies API placeholders to dist directory
gulp.task('api', function() {
    if (!isDevelopment) return;

    return gulp.src('app/api/**/*.json')
        .pipe(gulp.dest('dist/api'))
        .pipe(livereload());
});

//Copies static data (images, fonts)
gulp.task('assets', function() {
    return gulp.src(paths.assets)
        .pipe(gulp.dest('dist/assets'))
        .pipe(livereload());
});

//Default gulp task
gulp.task('default', ['build', 'serve'], function() {
    if (isDevelopment) {
        console.log('Development mode');
        gulp.start('watch')
    }
});

