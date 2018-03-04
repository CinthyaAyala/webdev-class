import gulp from 'gulp';
import less from 'gulp-less';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import cleanCSS from 'gulp-clean-css';
import del from 'del';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import replacePath from 'gulp-replace-path';
import path  from 'path';
import htmlmin from 'gulp-htmlmin';
import image from 'gulp-image';
import stripComments from 'gulp-strip-comments';

import AWS from 'aws-sdk';
import awsPublish from 'gulp-awspublish';
import mergeStream from 'merge-stream';

const paths = {
  images: {
    src: 'src/assets/img/**/*.*',
    dest: 'www/assets/img/'
  },
  styles: {
    src: 'src/styles/css/**/*.css',
    dest: 'www/styles/css/'
  },
  scripts: {
    src: 'src/scripts/js/**/*.js',
    dest: 'www/scripts/js/'
  },
  pageHome: {
    src: 'src/index.html',
    dest: 'www/'
  },
  pagesHtml: {
    src: 'src/pages/**/*.html',
    dest: 'www/pages/'
  },
  pagesCSS: {
    src: 'src/pages/**/*.css',
    dest: 'www/pages/'
  },
  shared: {
    src: 'src/shared/**/*.*',
    dest: 'www/shared/'
  }
};


/*
 * For small tasks you can export arrow functions
 */
export const clean = () => del([ 'assets' ]);

/*--------------------------------------------------------------------
                MAIN SITE COMPILATION
  --------------------------------------------------------------------*/
 export function images() {
   return gulp.src(paths.images.src)
     .pipe(image())
     .pipe(gulp.dest(paths.images.dest));
 }

export function styles() {
  return gulp.src(paths.styles.src)
    .pipe(cleanCSS())
    // pass in options to the stream
    .pipe(rename({
      base: '',
      suffix: ''
    }))
    .pipe(gulp.dest(paths.styles.dest));
}

export function scripts() {
  return gulp.src(paths.scripts.src, { sourcemaps: true })
    .pipe(stripComments())
    .pipe(babel())
    .pipe(uglify())
    .pipe(concat('app.js'))
    .pipe(gulp.dest(paths.scripts.dest));
}

export function pagesHtml() {
  return gulp.src(paths.pagesHtml.src)
    .pipe(stripComments())
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.pagesHtml.dest));
}

export function pageHome() {
  return gulp.src(paths.pageHome.src)
    .pipe(stripComments())
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.pageHome.dest));
}

export function pagesCSS() {
  return gulp.src(paths.pagesCSS.src)
    .pipe(cleanCSS())
    .pipe(rename({
      base: '',
      suffix: ''
    }))
    .pipe(gulp.dest(paths.pagesCSS.dest));
}

export function shared() {
  return gulp.src(paths.shared.src)
    .pipe(gulp.dest(paths.shared.dest));
}
/*--------------------------------------------------------------------
                END MAIN SITE COMPILATION
  --------------------------------------------------------------------*/

export function awsPublisher() {

  // create a new publisher using S3 options
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
  var publisher = awsPublish.create({
    region: 'us-east-1',
    params: {
      Bucket: 'webdev-class.lawrencemcdaniel.com'
    },
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'})
  }, {
    cacheFileName: ''
  });

  // define custom headers
  var headers = {
    'Cache-Control': 'max-age=315360000, no-transform, public'
    // ...
  };

  var gzip = gulp.src('./www/**/*.js').pipe(awsPublish.gzip());
  var plain = gulp.src('./www/**/*');

  return mergeStream(gzip, plain)
    .pipe(publisher.publish(headers))
    .pipe(publisher.sync())
    .pipe(publisher.cache())
    .pipe(awsPublish.reporter());
};

 /*
  * You could even use `export as` to rename exported tasks
  */
function watchFiles() {
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.pagesHtml.src, pages);
  gulp.watch(paths.pagesCSS.src, pages);
  gulp.watch(paths.pageHome.src, pages);
  gulp.watch(paths.shared.src, shared);
}
export { watchFiles as watch };

/*
 * You can still use `gulp.task`
 * for example to set task names that would otherwise be invalid
 */

const build = gulp.series(clean,
                          gulp.parallel(images, styles, scripts, pagesHtml, pagesCSS, pageHome, shared),
                          awsPublisher);


gulp.task('build', build);

/*
 * Export a default task
 */
export default build;
