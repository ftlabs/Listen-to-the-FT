const gulp = require('gulp');
const babel = require('gulp-babel');
 
gulp.task('buildApp', () => {
    return gulp.src('./client/scripts/main.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('./public/scripts/'));
});