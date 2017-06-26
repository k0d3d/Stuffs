# Stuffs - Inventory Management Solution

Stuffs is an pharmacy inventory management application built using AngularJS and NodeJs. Originally developed for 
[DrugStoc / Integra Health](http://about.drugstoc.com/). Stuffs is designed for Pharmacies and Health Institution Inventory although
it can be adapted for general purpose inventory.

## Getting Started

Stuff runs with Redis and MongoDB for data stores. You need to setup these values as environment varibles. This version is for evalution purpose only.

- REDIS_URL=redis://xxxxxx
- MONGOLAB_URI=mongodb://xxxxx

``` 
export REDIS_URL=redis://
export MONGOLAB_URI=mongodb://
```

### Prerequisites
* NodeJs 6.x
* MongoDB 
* Redis

You can get free Redis and MongoDB stores from Heroku Addons. 

### Installing

Installing Stuffs is straight forward

* git clone https://github.com/k0d3d/Stuffs.git
* cd Stuffs
* npm install
* Set env vars for MONGOLAB_URI and REDIS_URL
* npm start

### Screenshots



### And coding style

Stuffs is designed in the classic MVC pattern. Concerns are seperated in the ./app folder
* ./app/controllers - mostly express routes,  not much app logic
* ./app/models - CRUD, data manipulation, core business logic
* ./app/views - jade / pug templates
* 2 spaces for indentation, JSDoc code commenting.



## Built With

* [MEAN.io](http://www.dropwizard.io/1.0.2/docs/) - The web framework used

We use [SemVer](http://semver.org/) for versioning. 

## Authors

* **Michael Rhema** - *Initial work* - [Kingkoded](https://github.com/k0d3d)

## License

This project is licensed under the GNU General Public License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc
