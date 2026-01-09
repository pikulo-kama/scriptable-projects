# frozen_string_literal: true

source "https://rubygems.org"

gem "csv"
gem "base64"
gem "jekyll", "~> 4.3.4"
gem "jekyll-theme-chirpy", "~> 7.2", ">= 7.2.4"
# gem "github-pages", "~> 232", group: :jekyll_plugins
gem "html-proofer", "~> 5.0", group: :test

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
end

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.2.0", :platforms => [:mingw, :x64_mingw, :mswin]
