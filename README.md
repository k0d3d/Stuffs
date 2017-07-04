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
** These screenshots are from [DIMS](http://about.drugstoc.com) for evaluation purpose **

*Dashboard*
![Dashboard](https://image.ibb.co/h83tEa/screenshot_localhost_8888_2015_07_03_10_58_48.png)
*Inventory Overview*
![Inventory Overview](https://image.ibb.co/iBKB0F/screenshot_localhost_8888_2015_07_03_11_02_56.png)
*Place an Order*
![Place an Order](https://image.ibb.co/bH3h7v/screenshot_localhost_8888_2015_07_03_11_06_42.png)
*Print and Manage bills*
![Print Bill](https://image.ibb.co/kSCyfF/screenshot_localhost_8888_2015_07_03_11_08_33.png)
*Multiple Stock location*
![Stockup and Down](https://image.ibb.co/ip6r0F/screenshot_localhost_8888_2015_07_03_11_09_01.png)



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
