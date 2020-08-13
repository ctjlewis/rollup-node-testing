import path from 'path';
import fs from 'fs';

var envs = [
	{
		name: "nodejs",
		version: "0.2.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.3.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.4.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.5.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.6.0",
		date: "2011-11-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.7.0",
		date: "2012-01-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.8.0",
		date: "2012-06-22",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.9.0",
		date: "2012-07-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.10.0",
		date: "2013-03-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.11.0",
		date: "2013-03-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.12.0",
		date: "2015-02-06",
		lts: false,
		security: false
	},
	{
		name: "iojs",
		version: "1.0.0",
		date: "2015-01-14"
	},
	{
		name: "iojs",
		version: "1.1.0",
		date: "2015-02-03"
	},
	{
		name: "iojs",
		version: "1.2.0",
		date: "2015-02-11"
	},
	{
		name: "iojs",
		version: "1.3.0",
		date: "2015-02-20"
	},
	{
		name: "iojs",
		version: "1.5.0",
		date: "2015-03-06"
	},
	{
		name: "iojs",
		version: "1.6.0",
		date: "2015-03-20"
	},
	{
		name: "iojs",
		version: "2.0.0",
		date: "2015-05-04"
	},
	{
		name: "iojs",
		version: "2.1.0",
		date: "2015-05-24"
	},
	{
		name: "iojs",
		version: "2.2.0",
		date: "2015-06-01"
	},
	{
		name: "iojs",
		version: "2.3.0",
		date: "2015-06-13"
	},
	{
		name: "iojs",
		version: "2.4.0",
		date: "2015-07-17"
	},
	{
		name: "iojs",
		version: "2.5.0",
		date: "2015-07-28"
	},
	{
		name: "iojs",
		version: "3.0.0",
		date: "2015-08-04"
	},
	{
		name: "iojs",
		version: "3.1.0",
		date: "2015-08-19"
	},
	{
		name: "iojs",
		version: "3.2.0",
		date: "2015-08-25"
	},
	{
		name: "iojs",
		version: "3.3.0",
		date: "2015-09-02"
	},
	{
		name: "nodejs",
		version: "4.0.0",
		date: "2015-09-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "4.1.0",
		date: "2015-09-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "4.2.0",
		date: "2015-10-12",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.3.0",
		date: "2016-02-09",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.4.0",
		date: "2016-03-08",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.5.0",
		date: "2016-08-16",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.6.0",
		date: "2016-09-27",
		lts: "Argon",
		security: true
	},
	{
		name: "nodejs",
		version: "4.7.0",
		date: "2016-12-06",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.8.0",
		date: "2017-02-21",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.9.0",
		date: "2018-03-28",
		lts: "Argon",
		security: true
	},
	{
		name: "nodejs",
		version: "5.0.0",
		date: "2015-10-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.1.0",
		date: "2015-11-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.2.0",
		date: "2015-12-09",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.3.0",
		date: "2015-12-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.4.0",
		date: "2016-01-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.5.0",
		date: "2016-01-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.6.0",
		date: "2016-02-09",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.7.0",
		date: "2016-02-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.8.0",
		date: "2016-03-09",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.9.0",
		date: "2016-03-16",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.10.0",
		date: "2016-04-01",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.11.0",
		date: "2016-04-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.12.0",
		date: "2016-06-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.0.0",
		date: "2016-04-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.1.0",
		date: "2016-05-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.2.0",
		date: "2016-05-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.3.0",
		date: "2016-07-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.4.0",
		date: "2016-08-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.5.0",
		date: "2016-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.6.0",
		date: "2016-09-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.7.0",
		date: "2016-09-27",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "6.8.0",
		date: "2016-10-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.9.0",
		date: "2016-10-18",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.10.0",
		date: "2017-02-21",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.11.0",
		date: "2017-06-06",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.12.0",
		date: "2017-11-06",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.13.0",
		date: "2018-02-10",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.14.0",
		date: "2018-03-28",
		lts: "Boron",
		security: true
	},
	{
		name: "nodejs",
		version: "6.15.0",
		date: "2018-11-27",
		lts: "Boron",
		security: true
	},
	{
		name: "nodejs",
		version: "6.16.0",
		date: "2018-12-26",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.17.0",
		date: "2019-02-28",
		lts: "Boron",
		security: true
	},
	{
		name: "nodejs",
		version: "7.0.0",
		date: "2016-10-25",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.1.0",
		date: "2016-11-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.2.0",
		date: "2016-11-22",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.3.0",
		date: "2016-12-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.4.0",
		date: "2017-01-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.5.0",
		date: "2017-01-31",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.6.0",
		date: "2017-02-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.7.0",
		date: "2017-02-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.8.0",
		date: "2017-03-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.9.0",
		date: "2017-04-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.10.0",
		date: "2017-05-02",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.0.0",
		date: "2017-05-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.1.0",
		date: "2017-06-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.2.0",
		date: "2017-07-19",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.3.0",
		date: "2017-08-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.4.0",
		date: "2017-08-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.5.0",
		date: "2017-09-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.6.0",
		date: "2017-09-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.7.0",
		date: "2017-10-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.8.0",
		date: "2017-10-24",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.9.0",
		date: "2017-10-31",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.10.0",
		date: "2018-03-06",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.11.0",
		date: "2018-03-28",
		lts: "Carbon",
		security: true
	},
	{
		name: "nodejs",
		version: "8.12.0",
		date: "2018-09-10",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.13.0",
		date: "2018-11-20",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.14.0",
		date: "2018-11-27",
		lts: "Carbon",
		security: true
	},
	{
		name: "nodejs",
		version: "8.15.0",
		date: "2018-12-26",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.16.0",
		date: "2019-04-16",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.17.0",
		date: "2019-12-17",
		lts: "Carbon",
		security: true
	},
	{
		name: "nodejs",
		version: "9.0.0",
		date: "2017-10-31",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.1.0",
		date: "2017-11-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.2.0",
		date: "2017-11-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.3.0",
		date: "2017-12-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.4.0",
		date: "2018-01-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.5.0",
		date: "2018-01-31",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.6.0",
		date: "2018-02-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.7.0",
		date: "2018-03-01",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.8.0",
		date: "2018-03-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.9.0",
		date: "2018-03-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.10.0",
		date: "2018-03-28",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "9.11.0",
		date: "2018-04-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.0.0",
		date: "2018-04-24",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.1.0",
		date: "2018-05-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.2.0",
		date: "2018-05-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.3.0",
		date: "2018-05-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.4.0",
		date: "2018-06-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.5.0",
		date: "2018-06-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.6.0",
		date: "2018-07-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.7.0",
		date: "2018-07-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.8.0",
		date: "2018-08-01",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.9.0",
		date: "2018-08-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.10.0",
		date: "2018-09-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.11.0",
		date: "2018-09-19",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.12.0",
		date: "2018-10-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.13.0",
		date: "2018-10-30",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.14.0",
		date: "2018-11-27",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.15.0",
		date: "2018-12-26",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.16.0",
		date: "2019-05-28",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.17.0",
		date: "2019-10-21",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.18.0",
		date: "2019-12-16",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.19.0",
		date: "2020-02-05",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.20.0",
		date: "2020-03-24",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.21.0",
		date: "2020-06-02",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.22.0",
		date: "2020-07-21",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "11.0.0",
		date: "2018-10-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.1.0",
		date: "2018-10-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.2.0",
		date: "2018-11-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.3.0",
		date: "2018-11-27",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "11.4.0",
		date: "2018-12-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.5.0",
		date: "2018-12-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.6.0",
		date: "2018-12-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.7.0",
		date: "2019-01-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.8.0",
		date: "2019-01-24",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.9.0",
		date: "2019-01-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.10.0",
		date: "2019-02-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.11.0",
		date: "2019-03-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.12.0",
		date: "2019-03-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.13.0",
		date: "2019-03-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.14.0",
		date: "2019-04-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.15.0",
		date: "2019-04-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.0.0",
		date: "2019-04-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.1.0",
		date: "2019-04-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.2.0",
		date: "2019-05-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.3.0",
		date: "2019-05-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.4.0",
		date: "2019-06-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.5.0",
		date: "2019-06-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.6.0",
		date: "2019-07-03",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.7.0",
		date: "2019-07-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.8.0",
		date: "2019-08-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.9.0",
		date: "2019-08-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.10.0",
		date: "2019-09-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.11.0",
		date: "2019-09-25",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.12.0",
		date: "2019-10-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.13.0",
		date: "2019-10-21",
		lts: "Erbium",
		security: false
	},
	{
		name: "nodejs",
		version: "12.14.0",
		date: "2019-12-16",
		lts: "Erbium",
		security: true
	},
	{
		name: "nodejs",
		version: "12.15.0",
		date: "2020-02-05",
		lts: "Erbium",
		security: true
	},
	{
		name: "nodejs",
		version: "12.16.0",
		date: "2020-02-11",
		lts: "Erbium",
		security: false
	},
	{
		name: "nodejs",
		version: "12.17.0",
		date: "2020-05-26",
		lts: "Erbium",
		security: false
	},
	{
		name: "nodejs",
		version: "12.18.0",
		date: "2020-06-02",
		lts: "Erbium",
		security: true
	},
	{
		name: "nodejs",
		version: "13.0.0",
		date: "2019-10-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.1.0",
		date: "2019-11-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.2.0",
		date: "2019-11-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.3.0",
		date: "2019-12-03",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.4.0",
		date: "2019-12-17",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "13.5.0",
		date: "2019-12-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.6.0",
		date: "2020-01-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.7.0",
		date: "2020-01-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.8.0",
		date: "2020-02-05",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "13.9.0",
		date: "2020-02-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.10.0",
		date: "2020-03-03",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.11.0",
		date: "2020-03-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.12.0",
		date: "2020-03-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.13.0",
		date: "2020-04-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.14.0",
		date: "2020-04-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.0.0",
		date: "2020-04-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.1.0",
		date: "2020-04-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.2.0",
		date: "2020-05-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.3.0",
		date: "2020-05-19",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.4.0",
		date: "2020-06-02",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "14.5.0",
		date: "2020-06-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.6.0",
		date: "2020-07-15",
		lts: false,
		security: false
	}
];

var envs$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': envs
});

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var browsers={A:"ie",B:"edge",C:"firefox",D:"chrome",E:"safari",F:"opera",G:"ios_saf",H:"op_mini",I:"android",J:"bb",K:"op_mob",L:"and_chr",M:"and_ff",N:"ie_mob",O:"and_uc",P:"samsung",Q:"and_qq",R:"baidu",S:"kaios"};

var browsers_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
var browsers$1 = exports.browsers = browsers;
});

var browserVersions={"0":"48","1":"49","2":"50","3":"51","4":"52","5":"53","6":"54","7":"55","8":"56","9":"57",A:"10",B:"11",C:"12",D:"7",E:"9",F:"8",G:"4",H:"14",I:"6",J:"16",K:"17",L:"18",M:"81",N:"68",O:"13",P:"46",Q:"15",R:"11.1",S:"84",T:"69",U:"67",V:"79",W:"5",X:"19",Y:"20",Z:"21",a:"22",b:"23",c:"24",d:"25",e:"26",f:"27",g:"28",h:"29",i:"30",j:"31",k:"32",l:"33",m:"34",n:"35",o:"36",p:"37",q:"38",r:"39",s:"40",t:"41",u:"42",v:"43",w:"44",x:"45",y:"80",z:"47",AB:"58",BB:"12.1",CB:"60",DB:"66",EB:"62",FB:"63",GB:"64",HB:"65",IB:"4.2-4.3",JB:"61",KB:"3",LB:"59",MB:"70",NB:"71",OB:"72",PB:"73",QB:"74",RB:"75",SB:"76",TB:"77",UB:"78",VB:"11.5",WB:"83",XB:"10.1",YB:"3.2",ZB:"10.3",aB:"87",bB:"86",cB:"5.1",dB:"6.1",eB:"7.1",fB:"9.1",gB:"85",hB:"3.6",iB:"5.5",jB:"13.1",kB:"TP",lB:"9.5-9.6",mB:"10.0-10.1",nB:"10.5",oB:"10.6",pB:"3.5",qB:"11.6",rB:"4.0-4.1",sB:"2",tB:"5.0-5.1",uB:"6.0-6.1",vB:"7.0-7.1",wB:"8.1-8.4",xB:"9.0-9.2",yB:"9.3",zB:"10.0-10.2","0B":"3.1","1B":"11.0-11.2","2B":"11.3-11.4","3B":"12.0-12.1","4B":"12.2-12.4","5B":"13.0-13.1","6B":"13.2","7B":"13.3","8B":"13.4-13.5","9B":"14.0",AC:"all",BC:"2.1",CC:"2.2",DC:"2.3",EC:"4.1",FC:"4.4",GC:"4.4.3-4.4.4",HC:"12.12",IC:"5.0-5.4",JC:"6.2-6.4",KC:"7.2-7.4",LC:"8.2",MC:"9.2",NC:"11.1-11.2",OC:"12.0",PC:"10.4",QC:"7.12",RC:"2.5"};

var browserVersions_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
var browserVersions$1 = exports.browserVersions = browserVersions;
});

var agents={A:{A:{I:0.00595864,D:0.00595864,F:0.0715037,E:0.232387,A:0.0178759,B:1.30494,iB:0.009298},B:"ms",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","iB","I","D","F","E","A","B","","",""],E:"IE",F:{iB:962323200,I:998870400,D:1161129600,F:1237420800,E:1300060800,A:1346716800,B:1381968000}},B:{A:{C:0.009284,O:0.004642,H:0.013926,Q:0.009284,J:0.02321,K:0.088198,L:0.770572,V:0,y:0.004711,M:0.041778,WB:0.99803,S:0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","C","O","H","Q","J","K","L","V","y","M","WB","S","","",""],E:"Edge",F:{C:1438128000,O:1447286400,H:1470096000,Q:1491868800,J:1508198400,K:1525046400,L:1542067200,V:1579046400,y:1581033600,M:1586736000,WB:1590019200,S:1594857600},D:{C:"ms",O:"ms",H:"ms",Q:"ms",J:"ms",K:"ms",L:"ms"}},C:{A:{"0":0.018568,"1":0.004538,"2":0.004642,"3":0.004642,"4":0.11605,"5":0.004335,"6":0.009284,"7":0.009284,"8":0.018568,"9":0.009284,sB:0.004827,KB:0.004538,G:0.013926,W:0.004879,I:0.020136,D:0.005725,F:0.004525,E:0.00533,A:0.004283,B:0.004711,C:0.004471,O:0.004486,H:0.00453,Q:0.004465,J:0.004417,K:0.008922,L:0.004393,X:0.004443,Y:0.004283,Z:0.013596,a:0.013698,b:0.013614,c:0.008786,d:0.004403,e:0.004317,f:0.004393,g:0.004418,h:0.008834,i:0.004403,j:0.008928,k:0.004471,l:0.009284,m:0.004707,n:0.009076,o:0.004465,p:0.004783,q:0.004642,r:0.004783,s:0.00487,t:0.005029,u:0.0047,v:0.041778,w:0.004642,x:0.009284,P:0.004525,z:0.009284,AB:0.004642,LB:0.009284,CB:0.018568,JB:0.009284,EB:0.009284,FB:0.037136,GB:0.027852,HB:0.027852,DB:0.02321,U:0.009284,N:0.13926,T:0.009284,MB:0.009284,NB:0.009284,OB:0.032494,PB:0.009284,QB:0.018568,RB:0.018568,SB:0.051062,TB:0.645238,UB:2.36742,V:0.148544,y:0,M:0,pB:0.008786,hB:0.00487},B:"moz",C:["sB","KB","pB","hB","G","W","I","D","F","E","A","B","C","O","H","Q","J","K","L","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","P","z","0","1","2","3","4","5","6","7","8","9","AB","LB","CB","JB","EB","FB","GB","HB","DB","U","N","T","MB","NB","OB","PB","QB","RB","SB","TB","UB","V","y","M",""],E:"Firefox",F:{"0":1470096000,"1":1474329600,"2":1479168000,"3":1485216000,"4":1488844800,"5":1492560000,"6":1497312000,"7":1502150400,"8":1506556800,"9":1510617600,sB:1161648000,KB:1213660800,pB:1246320000,hB:1264032000,G:1300752000,W:1308614400,I:1313452800,D:1317081600,F:1317081600,E:1320710400,A:1324339200,B:1327968000,C:1331596800,O:1335225600,H:1338854400,Q:1342483200,J:1346112000,K:1349740800,L:1353628800,X:1357603200,Y:1361232000,Z:1364860800,a:1368489600,b:1372118400,c:1375747200,d:1379376000,e:1386633600,f:1391472000,g:1395100800,h:1398729600,i:1402358400,j:1405987200,k:1409616000,l:1413244800,m:1417392000,n:1421107200,o:1424736000,p:1428278400,q:1431475200,r:1435881600,s:1439251200,t:1442880000,u:1446508800,v:1450137600,w:1453852800,x:1457395200,P:1461628800,z:1465257600,AB:1516665600,LB:1520985600,CB:1525824000,JB:1529971200,EB:1536105600,FB:1540252800,GB:1544486400,HB:1548720000,DB:1552953600,U:1558396800,N:1562630400,T:1567468800,MB:1571788800,NB:1575331200,OB:1578355200,PB:1581379200,QB:1583798400,RB:1586304000,SB:1588636800,TB:1591056000,UB:1593475200,V:1595894400,y:null,M:null}},D:{A:{"0":0.02321,"1":0.311014,"2":0.004642,"3":0.009284,"4":0.004642,"5":0.041778,"6":0.018568,"7":0.013926,"8":0.027852,"9":0.027852,G:0.004706,W:0.004879,I:0.004879,D:0.005591,F:0.005591,E:0.005591,A:0.004534,B:0.004464,C:0.010424,O:0.009284,H:0.004706,Q:0.015087,J:0.004393,K:0.004393,L:0.008652,X:0.004418,Y:0.004393,Z:0.004317,a:0.013926,b:0.008786,c:0.004538,d:0.004461,e:0.004711,f:0.004326,g:0.0047,h:0.004538,i:0.004335,j:0.009284,k:0.004566,l:0.009422,m:0.009284,n:0.004335,o:0.004335,p:0.004464,q:0.027852,r:0.004464,s:0.013926,t:0.032494,u:0.004403,v:0.013926,w:0.004465,x:0.004642,P:0.004642,z:0.009284,AB:0.027852,LB:0.009284,CB:0.013926,JB:0.037136,EB:0.018568,FB:0.051062,GB:0.018568,HB:0.04642,DB:0.032494,U:0.04642,N:0.027852,T:0.088198,MB:0.181038,NB:0.218174,OB:0.213532,PB:0.120692,QB:0.111408,RB:0.09284,SB:0.102124,TB:0.083556,UB:0.125334,V:0.218174,y:0.37136,M:0.450274,WB:17.3472,S:10.4074,gB:0.027852,bB:0.018568,aB:0},B:"webkit",C:["G","W","I","D","F","E","A","B","C","O","H","Q","J","K","L","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","P","z","0","1","2","3","4","5","6","7","8","9","AB","LB","CB","JB","EB","FB","GB","HB","DB","U","N","T","MB","NB","OB","PB","QB","RB","SB","TB","UB","V","y","M","WB","S","gB","bB","aB"],E:"Chrome",F:{"0":1453248000,"1":1456963200,"2":1460592000,"3":1464134400,"4":1469059200,"5":1472601600,"6":1476230400,"7":1480550400,"8":1485302400,"9":1489017600,G:1264377600,W:1274745600,I:1283385600,D:1287619200,F:1291248000,E:1296777600,A:1299542400,B:1303862400,C:1307404800,O:1312243200,H:1316131200,Q:1316131200,J:1319500800,K:1323734400,L:1328659200,X:1332892800,Y:1337040000,Z:1340668800,a:1343692800,b:1348531200,c:1352246400,d:1357862400,e:1361404800,f:1364428800,g:1369094400,h:1374105600,i:1376956800,j:1384214400,k:1389657600,l:1392940800,m:1397001600,n:1400544000,o:1405468800,p:1409011200,q:1412640000,r:1416268800,s:1421798400,t:1425513600,u:1429401600,v:1432080000,w:1437523200,x:1441152000,P:1444780800,z:1449014400,AB:1492560000,LB:1496707200,CB:1500940800,JB:1504569600,EB:1508198400,FB:1512518400,GB:1516752000,HB:1520294400,DB:1523923200,U:1527552000,N:1532390400,T:1536019200,MB:1539648000,NB:1543968000,OB:1548720000,PB:1552348800,QB:1555977600,RB:1559606400,SB:1564444800,TB:1568073600,UB:1571702400,V:1575936000,y:1580860800,M:1586304000,WB:1589846400,S:1594684800,gB:null,bB:null,aB:null}},E:{A:{G:0,W:0.004566,I:0.004656,D:0.004465,F:0.004642,E:0.004642,A:0.009284,B:0.018568,C:0.055704,O:0.357434,H:0.013926,"0B":0,YB:0.008692,cB:0.148544,dB:0.00456,eB:0.004283,fB:0.037136,XB:0.051062,R:0.11605,BB:0.199606,jB:2.82698,kB:0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","0B","YB","G","W","cB","I","dB","D","eB","F","E","fB","A","XB","B","R","C","BB","O","jB","H","kB",""],E:"Safari",F:{"0B":1205798400,YB:1226534400,G:1244419200,W:1275868800,cB:1311120000,I:1343174400,dB:1382400000,D:1382400000,eB:1410998400,F:1413417600,E:1443657600,fB:1458518400,A:1474329600,XB:1490572800,B:1505779200,R:1522281600,C:1537142400,BB:1553472000,O:1568851200,jB:1585008000,H:null,kB:null}},F:{A:{"0":0.004707,"1":0.004827,"2":0.004707,"3":0.004707,"4":0.004326,"5":0.008922,"6":0.014349,"7":0.004725,"8":0.009284,"9":0.009284,E:0.0082,B:0.016581,C:0.004317,Q:0.00685,J:0.00685,K:0.00685,L:0.005014,X:0.006015,Y:0.004879,Z:0.006597,a:0.006597,b:0.013434,c:0.006702,d:0.006015,e:0.005595,f:0.004393,g:0.008652,h:0.004879,i:0.004879,j:0.004711,k:0.005152,l:0.005014,m:0.009758,n:0.004879,o:0.009284,p:0.004283,q:0.004367,r:0.004534,s:0.004367,t:0.004227,u:0.004418,v:0.009042,w:0.004227,x:0.004725,P:0.004417,z:0.008942,AB:0.013926,CB:0.004403,EB:0.004532,FB:0.004566,GB:0.02283,HB:0.00867,DB:0.004656,U:0.004642,N:0.64988,T:0.32494,lB:0.00685,mB:0,nB:0.008392,oB:0.004706,R:0.006229,VB:0.004879,qB:0.008786,BB:0.009284},B:"webkit",C:["","","","","","","","","","","","","","","","","E","lB","mB","nB","oB","B","R","VB","qB","C","BB","Q","J","K","L","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","P","z","0","1","2","3","4","5","6","7","8","9","AB","CB","EB","FB","GB","HB","DB","U","N","T","","",""],E:"Opera",F:{"0":1506470400,"1":1510099200,"2":1515024000,"3":1517961600,"4":1521676800,"5":1525910400,"6":1530144000,"7":1534982400,"8":1537833600,"9":1543363200,E:1150761600,lB:1223424000,mB:1251763200,nB:1267488000,oB:1277942400,B:1292457600,R:1302566400,VB:1309219200,qB:1323129600,C:1323129600,BB:1352073600,Q:1372723200,J:1377561600,K:1381104000,L:1386288000,X:1390867200,Y:1393891200,Z:1399334400,a:1401753600,b:1405987200,c:1409616000,d:1413331200,e:1417132800,f:1422316800,g:1425945600,h:1430179200,i:1433808000,j:1438646400,k:1442448000,l:1445904000,m:1449100800,n:1454371200,o:1457308800,p:1462320000,q:1465344000,r:1470096000,s:1474329600,t:1477267200,u:1481587200,v:1486425600,w:1490054400,x:1494374400,P:1498003200,z:1502236800,AB:1548201600,CB:1554768000,EB:1561593600,FB:1566259200,GB:1570406400,HB:1573689600,DB:1578441600,U:1583971200,N:1587513600,T:1592956800},D:{E:"o",B:"o",C:"o",lB:"o",mB:"o",nB:"o",oB:"o",R:"o",VB:"o",qB:"o",BB:"o"}},G:{A:{F:0,YB:0.00306541,rB:0.00306541,IB:0.00306541,tB:0.00919623,uB:0.00306541,vB:0.0122616,wB:0.0183925,xB:0.0245233,yB:0.202317,zB:0.052112,ZB:0.245233,"1B":0.180859,"2B":0.285083,"3B":0.386242,"4B":2.35117,"5B":0.438354,"6B":0.214579,"7B":2.14272,"8B":5.18054,"9B":0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","YB","rB","IB","tB","uB","vB","F","wB","xB","yB","zB","ZB","1B","2B","3B","4B","5B","6B","7B","8B","9B","",""],E:"iOS Safari",F:{YB:1270252800,rB:1283904000,IB:1299628800,tB:1331078400,uB:1359331200,vB:1394409600,F:1410912000,wB:1413763200,xB:1442361600,yB:1458518400,zB:1473724800,ZB:1490572800,"1B":1505779200,"2B":1522281600,"3B":1537142400,"4B":1553472000,"5B":1568851200,"6B":1572220800,"7B":1580169600,"8B":1585008000,"9B":null}},H:{A:{AC:0.907827},B:"o",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","AC","","",""],E:"Opera Mini",F:{AC:1426464000}},I:{A:{KB:0,G:0.00758717,M:0,BC:0,CC:0,DC:0.000758717,EC:0.0128982,IB:0.0212441,FC:0,GC:0.134293},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","BC","CC","DC","KB","G","EC","IB","FC","GC","M","","",""],E:"Android Browser",F:{BC:1256515200,CC:1274313600,DC:1291593600,KB:1298332800,G:1318896000,EC:1341792000,IB:1374624000,FC:1386547200,GC:1401667200,M:1587427200}},J:{A:{D:0,A:0.005357},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","D","A","","",""],E:"Blackberry Browser",F:{D:1325376000,A:1359504000}},K:{A:{A:0,B:0,C:0,P:0.0111391,R:0,VB:0,BB:0},B:"o",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","A","B","R","VB","C","BB","P","","",""],E:"Opera Mobile",F:{A:1287100800,B:1300752000,R:1314835200,VB:1318291200,C:1330300800,BB:1349740800,P:1474588800},D:{P:"webkit"}},L:{A:{S:35.3789},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","S","","",""],E:"Chrome for Android",F:{S:1594684800}},M:{A:{N:0.257136},B:"moz",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","N","","",""],E:"Firefox for Android",F:{N:1567468800}},N:{A:{A:0.0115934,B:0.022664},B:"ms",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","A","B","","",""],E:"IE Mobile",F:{A:1340150400,B:1353456000}},O:{A:{HC:1.47318},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","HC","","",""],E:"UC Browser for Android",F:{HC:1471392000},D:{HC:"webkit"}},P:{A:{G:0.300468,IC:0.010361,JC:0.010361,KC:0.0932486,LC:0.0207219,MC:0.176136,XB:0.145053,NC:0.600936,OC:2.25869},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","G","IC","JC","KC","LC","MC","XB","NC","OC","","",""],E:"Samsung Internet",F:{G:1461024000,IC:1481846400,JC:1509408000,KC:1528329600,LC:1546128000,MC:1554163200,XB:1567900800,NC:1582588800,OC:1593475200}},Q:{A:{PC:0.219637},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","PC","","",""],E:"QQ Browser",F:{PC:1589846400}},R:{A:{QC:0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","QC","","",""],E:"Baidu Browser",F:{QC:1491004800}},S:{A:{RC:0.05357},B:"moz",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","RC","","",""],E:"KaiOS Browser",F:{RC:1527811200}}};

var agents_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.agents = undefined;







function unpackBrowserVersions(versionsData) {
    return Object.keys(versionsData).reduce(function (usage, version) {
        usage[browserVersions_1.browserVersions[version]] = versionsData[version];
        return usage;
    }, {});
}

var agents$1 = exports.agents = Object.keys(agents).reduce(function (map, key) {
    var versionsData = agents[key];
    map[browsers_1.browsers[key]] = Object.keys(versionsData).reduce(function (data, entry) {
        if (entry === 'A') {
            data.usage_global = unpackBrowserVersions(versionsData[entry]);
        } else if (entry === 'C') {
            data.versions = versionsData[entry].reduce(function (list, version) {
                if (version === '') {
                    list.push(null);
                } else {
                    list.push(browserVersions_1.browserVersions[version]);
                }
                return list;
            }, []);
        } else if (entry === 'D') {
            data.prefix_exceptions = unpackBrowserVersions(versionsData[entry]);
        } else if (entry === 'E') {
            data.browser = versionsData[entry];
        } else if (entry === 'F') {
            data.release_date = Object.keys(versionsData[entry]).reduce(function (map, key) {
                map[browserVersions_1.browserVersions[key]] = versionsData[entry][key];
                return map;
            }, {});
        } else {
            // entry is B
            data.prefix = versionsData[entry];
        }
        return data;
    }, {});
    return map;
}, {});
});

var v4 = {
	start: "2015-09-08",
	lts: "2015-10-12",
	maintenance: "2017-04-01",
	end: "2018-04-30",
	codename: "Argon"
};
var v5 = {
	start: "2015-10-29",
	maintenance: "2016-04-30",
	end: "2016-06-30"
};
var v6 = {
	start: "2016-04-26",
	lts: "2016-10-18",
	maintenance: "2018-04-30",
	end: "2019-04-30",
	codename: "Boron"
};
var v7 = {
	start: "2016-10-25",
	maintenance: "2017-04-30",
	end: "2017-06-30"
};
var v8 = {
	start: "2017-05-30",
	lts: "2017-10-31",
	maintenance: "2019-01-01",
	end: "2019-12-31",
	codename: "Carbon"
};
var v9 = {
	start: "2017-10-01",
	maintenance: "2018-04-01",
	end: "2018-06-30"
};
var v10 = {
	start: "2018-04-24",
	lts: "2018-10-30",
	maintenance: "2020-05-19",
	end: "2021-04-30",
	codename: "Dubnium"
};
var v11 = {
	start: "2018-10-23",
	maintenance: "2019-04-22",
	end: "2019-06-01"
};
var v12 = {
	start: "2019-04-23",
	lts: "2019-10-21",
	maintenance: "2020-10-20",
	end: "2022-04-30",
	codename: "Erbium"
};
var v13 = {
	start: "2019-10-22",
	maintenance: "2020-04-01",
	end: "2020-06-01"
};
var v14 = {
	start: "2020-04-21",
	lts: "2020-10-20",
	maintenance: "2021-10-19",
	end: "2023-04-30",
	codename: ""
};
var v15 = {
	start: "2020-10-21",
	maintenance: "2021-04-01",
	end: "2021-06-01"
};
var releaseSchedule = {
	"v0.10": {
	start: "2013-03-11",
	end: "2016-10-31"
},
	"v0.12": {
	start: "2015-02-06",
	end: "2016-12-31"
},
	v4: v4,
	v5: v5,
	v6: v6,
	v7: v7,
	v8: v8,
	v9: v9,
	v10: v10,
	v11: v11,
	v12: v12,
	v13: v13,
	v14: v14,
	v15: v15
};

var releaseSchedule$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  v4: v4,
  v5: v5,
  v6: v6,
  v7: v7,
  v8: v8,
  v9: v9,
  v10: v10,
  v11: v11,
  v12: v12,
  v13: v13,
  v14: v14,
  v15: v15,
  'default': releaseSchedule
});

var versions = {
	"0.20": "39",
	"0.21": "41",
	"0.22": "41",
	"0.23": "41",
	"0.24": "41",
	"0.25": "42",
	"0.26": "42",
	"0.27": "43",
	"0.28": "43",
	"0.29": "43",
	"0.30": "44",
	"0.31": "45",
	"0.32": "45",
	"0.33": "45",
	"0.34": "45",
	"0.35": "45",
	"0.36": "47",
	"0.37": "49",
	"1.0": "49",
	"1.1": "50",
	"1.2": "51",
	"1.3": "52",
	"1.4": "53",
	"1.5": "54",
	"1.6": "56",
	"1.7": "58",
	"1.8": "59",
	"2.0": "61",
	"2.1": "61",
	"3.0": "66",
	"3.1": "66",
	"4.0": "69",
	"4.1": "69",
	"4.2": "69",
	"5.0": "73",
	"6.0": "76",
	"6.1": "76",
	"7.0": "78",
	"7.1": "78",
	"7.2": "78",
	"7.3": "78",
	"8.0": "80",
	"8.1": "80",
	"8.2": "80",
	"8.3": "80",
	"8.4": "80",
	"8.5": "80",
	"9.0": "83",
	"9.1": "83",
	"9.2": "83",
	"10.0": "85"
};

function BrowserslistError (message) {
  this.name = 'BrowserslistError';
  this.message = message;
  this.browserslist = true;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, BrowserslistError);
  }
}

BrowserslistError.prototype = Error.prototype;

var error = BrowserslistError;

var statuses = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    1: "ls", // WHATWG Living Standard
    2: "rec", // W3C Recommendation
    3: "pr", // W3C Proposed Recommendation
    4: "cr", // W3C Candidate Recommendation
    5: "wd", // W3C Working Draft
    6: "other", // Non-W3C, but reputable
    7: "unoff" // Unofficial, Editor's Draft or W3C "Note"
};
});

var supported = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    y: 1 << 0,
    n: 1 << 1,
    a: 1 << 2,
    p: 1 << 3,
    u: 1 << 4,
    x: 1 << 5,
    d: 1 << 6
};
});

var feature = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = unpackFeature;



var _statuses2 = _interopRequireDefault(statuses);



var _supported2 = _interopRequireDefault(supported);





function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MATH2LOG = Math.log(2);

function unpackSupport(cipher) {
    // bit flags
    var stats = Object.keys(_supported2.default).reduce(function (list, support) {
        if (cipher & _supported2.default[support]) list.push(support);
        return list;
    }, []);

    // notes
    var notes = cipher >> 7;
    var notesArray = [];
    while (notes) {
        var note = Math.floor(Math.log(notes) / MATH2LOG) + 1;
        notesArray.unshift('#' + note);
        notes -= Math.pow(2, note - 1);
    }

    return stats.concat(notesArray).join(' ');
}

function unpackFeature(packed) {
    var unpacked = { status: _statuses2.default[packed.B], title: packed.C };
    unpacked.stats = Object.keys(packed.A).reduce(function (browserStats, key) {
        var browser = packed.A[key];
        browserStats[browsers_1.browsers[key]] = Object.keys(browser).reduce(function (stats, support) {
            var packedVersions = browser[support].split(' ');
            var unpacked = unpackSupport(support);
            packedVersions.forEach(function (v) {
                return stats[browserVersions_1.browserVersions[v]] = unpacked;
            });
            return stats;
        }, {});
        return browserStats;
    }, {});
    return unpacked;
}
});

var region = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = unpackRegion;



function unpackRegion(packed) {
    return Object.keys(packed).reduce(function (list, browser) {
        var data = packed[browser];
        list[browsers_1.browsers[browser]] = Object.keys(data).reduce(function (memo, key) {
            var stats = data[key];
            if (key === '_') {
                stats.split(' ').forEach(function (version) {
                    return memo[version] = null;
                });
            } else {
                memo[key] = stats;
            }
            return memo;
        }, {});
        return list;
    }, {});
}
});

var node = createCommonjsModule(function (module) {
var feature$1 = feature.default;
var region$1 = region.default;





var IS_SECTION = /^\s*\[(.+)]\s*$/;
var CONFIG_PATTERN = /^browserslist-config-/;
var SCOPED_CONFIG__PATTERN = /@[^/]+\/browserslist-config(-|$|\/)/;
var TIME_TO_UPDATE_CANIUSE = 6 * 30 * 24 * 60 * 60 * 1000;
var FORMAT = 'Browserslist config should be a string or an array ' +
             'of strings with browser queries';

var dataTimeChecked = false;
var filenessCache = { };
var configCache = { };
function checkExtend (name) {
  var use = ' Use `dangerousExtend` option to disable.';
  if (!CONFIG_PATTERN.test(name) && !SCOPED_CONFIG__PATTERN.test(name)) {
    throw new error(
      'Browserslist config needs `browserslist-config-` prefix. ' + use)
  }
  if (name.replace(/^@[^/]+\//, '').indexOf('.') !== -1) {
    throw new error(
      '`.` not allowed in Browserslist config name. ' + use)
  }
  if (name.indexOf('node_modules') !== -1) {
    throw new error(
      '`node_modules` not allowed in Browserslist config.' + use)
  }
}

function isFile (file) {
  if (file in filenessCache) {
    return filenessCache[file]
  }
  var result = fs.existsSync(file) && fs.statSync(file).isFile();
  if (!process.env.BROWSERSLIST_DISABLE_CACHE) {
    filenessCache[file] = result;
  }
  return result
}

function eachParent (file, callback) {
  var dir = isFile(file) ? path.dirname(file) : file;
  var loc = path.resolve(dir);
  do {
    var result = callback(loc);
    if (typeof result !== 'undefined') return result
  } while (loc !== (loc = path.dirname(loc)))
  return undefined
}

function check (section) {
  if (Array.isArray(section)) {
    for (var i = 0; i < section.length; i++) {
      if (typeof section[i] !== 'string') {
        throw new error(FORMAT)
      }
    }
  } else if (typeof section !== 'string') {
    throw new error(FORMAT)
  }
}

function pickEnv (config, opts) {
  if (typeof config !== 'object') return config

  var name;
  if (typeof opts.env === 'string') {
    name = opts.env;
  } else if (process.env.BROWSERSLIST_ENV) {
    name = process.env.BROWSERSLIST_ENV;
  } else if (process.env.NODE_ENV) {
    name = process.env.NODE_ENV;
  } else {
    name = 'production';
  }

  return config[name] || config.defaults
}

function parsePackage (file) {
  var config = JSON.parse(fs.readFileSync(file));
  if (config.browserlist && !config.browserslist) {
    throw new error(
      '`browserlist` key instead of `browserslist` in ' + file
    )
  }
  var list = config.browserslist;
  if (Array.isArray(list) || typeof list === 'string') {
    list = { defaults: list };
  }
  for (var i in list) {
    check(list[i]);
  }

  return list
}

function latestReleaseTime (agents) {
  var latest = 0;
  for (var name in agents) {
    var dates = agents[name].releaseDate || { };
    for (var key in dates) {
      if (latest < dates[key]) {
        latest = dates[key];
      }
    }
  }
  return latest * 1000
}

function normalizeStats (data, stats) {
  if (stats && 'dataByBrowser' in stats) {
    stats = stats.dataByBrowser;
  }

  if (typeof stats !== 'object') return undefined

  var normalized = { };
  for (var i in stats) {
    var versions = Object.keys(stats[i]);
    if (
      versions.length === 1 &&
      data[i] &&
      data[i].versions.length === 1
    ) {
      var normal = Object.keys(data[i].versions)[0];
      normalized[i] = { };
      normalized[i][normal] = stats[i][versions[0]];
    } else {
      normalized[i] = stats[i];
    }
  }

  return normalized
}

function normalizeUsageData (usageData, data) {
  for (var browser in usageData) {
    var browserUsage = usageData[browser];
    // eslint-disable-next-line max-len
    // https://github.com/browserslist/browserslist/issues/431#issuecomment-565230615
    // caniuse-db returns { 0: "percentage" } for `and_*` regional stats
    if ('0' in browserUsage) {
      var versions = data[browser].versions;
      browserUsage[versions[versions.length - 1]] = browserUsage[0];
      delete browserUsage[0];
    }
  }
}

module.exports = {
  loadQueries: function loadQueries (context, name) {
    if (!context.dangerousExtend) checkExtend(name);
    // eslint-disable-next-line security/detect-non-literal-require
    var queries = commonjsRequire(require.resolve(name, { paths: ['.'] }));
    if (queries) {
      if (Array.isArray(queries)) {
        return queries
      } else if (typeof queries === 'object') {
        if (!queries.defaults) queries.defaults = [];
        return pickEnv(queries, context)
      }
    }
    throw new error(
      '`' + name + '` config exports not an array of queries' +
      ' or an object of envs'
    )
  },

  loadStat: function loadStat (context, name, data) {
    if (!context.dangerousExtend) checkExtend(name);
    // eslint-disable-next-line security/detect-non-literal-require
    var stats = commonjsRequire(
      require.resolve(
        path.join(name, 'browserslist-stats.json'),
        { paths: ['.'] }
      )
    );
    return normalizeStats(data, stats)
  },

  getStat: function getStat (opts, data) {
    var stats;
    if (opts.stats) {
      stats = opts.stats;
    } else if (process.env.BROWSERSLIST_STATS) {
      stats = process.env.BROWSERSLIST_STATS;
    } else if (opts.path && path.resolve && fs.existsSync) {
      stats = eachParent(opts.path, function (dir) {
        var file = path.join(dir, 'browserslist-stats.json');
        return isFile(file) ? file : undefined
      });
    }
    if (typeof stats === 'string') {
      try {
        stats = JSON.parse(fs.readFileSync(stats));
      } catch (e) {
        throw new error('Can\'t read ' + stats)
      }
    }
    return normalizeStats(data, stats)
  },

  loadConfig: function loadConfig (opts) {
    if (process.env.BROWSERSLIST) {
      return process.env.BROWSERSLIST
    } else if (opts.config || process.env.BROWSERSLIST_CONFIG) {
      var file = opts.config || process.env.BROWSERSLIST_CONFIG;
      if (path.basename(file) === 'package.json') {
        return pickEnv(parsePackage(file), opts)
      } else {
        return pickEnv(module.exports.readConfig(file), opts)
      }
    } else if (opts.path) {
      return pickEnv(module.exports.findConfig(opts.path), opts)
    } else {
      return undefined
    }
  },

  loadCountry: function loadCountry (usage, country, data) {
    var code = country.replace(/[^\w-]/g, '');
    if (!usage[code]) {
      // eslint-disable-next-line security/detect-non-literal-require
      var compressed = commonjsRequire();
      var usageData = region$1(compressed);
      normalizeUsageData(usageData, data);
      usage[country] = { };
      for (var i in usageData) {
        for (var j in usageData[i]) {
          usage[country][i + ' ' + j] = usageData[i][j];
        }
      }
    }
  },

  loadFeature: function loadFeature (features, name) {
    name = name.replace(/[^\w-]/g, '');
    if (features[name]) return

    // eslint-disable-next-line security/detect-non-literal-require
    var compressed = commonjsRequire();
    var stats = feature$1(compressed).stats;
    features[name] = { };
    for (var i in stats) {
      for (var j in stats[i]) {
        features[name][i + ' ' + j] = stats[i][j];
      }
    }
  },

  parseConfig: function parseConfig (string) {
    var result = { defaults: [] };
    var sections = ['defaults'];

    string.toString()
      .replace(/#[^\n]*/g, '')
      .split(/\n|,/)
      .map(function (line) {
        return line.trim()
      })
      .filter(function (line) {
        return line !== ''
      })
      .forEach(function (line) {
        if (IS_SECTION.test(line)) {
          sections = line.match(IS_SECTION)[1].trim().split(' ');
          sections.forEach(function (section) {
            if (result[section]) {
              throw new error(
                'Duplicate section ' + section + ' in Browserslist config'
              )
            }
            result[section] = [];
          });
        } else {
          sections.forEach(function (section) {
            result[section].push(line);
          });
        }
      });

    return result
  },

  readConfig: function readConfig (file) {
    if (!isFile(file)) {
      throw new error('Can\'t read ' + file + ' config')
    }
    return module.exports.parseConfig(fs.readFileSync(file))
  },

  findConfig: function findConfig (from) {
    from = path.resolve(from);

    var passed = [];
    var resolved = eachParent(from, function (dir) {
      if (dir in configCache) {
        return configCache[dir]
      }

      passed.push(dir);

      var config = path.join(dir, 'browserslist');
      var pkg = path.join(dir, 'package.json');
      var rc = path.join(dir, '.browserslistrc');

      var pkgBrowserslist;
      if (isFile(pkg)) {
        try {
          pkgBrowserslist = parsePackage(pkg);
        } catch (e) {
          if (e.name === 'BrowserslistError') throw e
          console.warn(
            '[Browserslist] Could not parse ' + pkg + '. Ignoring it.'
          );
        }
      }

      if (isFile(config) && pkgBrowserslist) {
        throw new error(
          dir + ' contains both browserslist and package.json with browsers'
        )
      } else if (isFile(rc) && pkgBrowserslist) {
        throw new error(
          dir + ' contains both .browserslistrc and package.json with browsers'
        )
      } else if (isFile(config) && isFile(rc)) {
        throw new error(
          dir + ' contains both .browserslistrc and browserslist'
        )
      } else if (isFile(config)) {
        return module.exports.readConfig(config)
      } else if (isFile(rc)) {
        return module.exports.readConfig(rc)
      } else {
        return pkgBrowserslist
      }
    });
    if (!process.env.BROWSERSLIST_DISABLE_CACHE) {
      passed.forEach(function (dir) {
        configCache[dir] = resolved;
      });
    }
    return resolved
  },

  clearCaches: function clearCaches () {
    dataTimeChecked = false;
    filenessCache = { };
    configCache = { };

    this.cache = { };
  },

  oldDataWarning: function oldDataWarning (agentsObj) {
    if (dataTimeChecked) return
    dataTimeChecked = true;
    if (process.env.BROWSERSLIST_IGNORE_OLD_DATA) return

    var latest = latestReleaseTime(agentsObj);
    var halfYearAgo = Date.now() - TIME_TO_UPDATE_CANIUSE;

    if (latest !== 0 && latest < halfYearAgo) {
      console.warn(
        'Browserslist: caniuse-lite is outdated. Please run:\n' +
        'npx browserslist@latest --update-db'
      );
    }
  },

  currentNode: function currentNode () {
    return 'node ' + process.versions.node
  }
};
});

var jsReleases = getCjsExportFromNamespace(envs$1);

var jsEOL = getCjsExportFromNamespace(releaseSchedule$1);

var agents$1 = agents_1.agents;





 // Will load browser.js in webpack

var YEAR = 365.259641 * 24 * 60 * 60 * 1000;
var ANDROID_EVERGREEN_FIRST = 37;

var QUERY_OR = 1;
var QUERY_AND = 2;

function isVersionsMatch (versionA, versionB) {
  return (versionA + '.').indexOf(versionB + '.') === 0
}

function isEolReleased (name) {
  var version = name.slice(1);
  return jsReleases.some(function (i) {
    return isVersionsMatch(i.version, version)
  })
}

function normalize (versions) {
  return versions.filter(function (version) {
    return typeof version === 'string'
  })
}

function normalizeElectron (version) {
  var versionToUse = version;
  if (version.split('.').length === 3) {
    versionToUse = version
      .split('.')
      .slice(0, -1)
      .join('.');
  }
  return versionToUse
}

function nameMapper (name) {
  return function mapName (version) {
    return name + ' ' + version
  }
}

function getMajor (version) {
  return parseInt(version.split('.')[0])
}

function getMajorVersions (released, number) {
  if (released.length === 0) return []
  var majorVersions = uniq(released.map(getMajor));
  var minimum = majorVersions[majorVersions.length - number];
  if (!minimum) {
    return released
  }
  var selected = [];
  for (var i = released.length - 1; i >= 0; i--) {
    if (minimum > getMajor(released[i])) break
    selected.unshift(released[i]);
  }
  return selected
}

function uniq (array) {
  var filtered = [];
  for (var i = 0; i < array.length; i++) {
    if (filtered.indexOf(array[i]) === -1) filtered.push(array[i]);
  }
  return filtered
}

// Helpers

function fillUsage (result, name, data) {
  for (var i in data) {
    result[name + ' ' + i] = data[i];
  }
}

function generateFilter (sign, version) {
  version = parseFloat(version);
  if (sign === '>') {
    return function (v) {
      return parseFloat(v) > version
    }
  } else if (sign === '>=') {
    return function (v) {
      return parseFloat(v) >= version
    }
  } else if (sign === '<') {
    return function (v) {
      return parseFloat(v) < version
    }
  } else {
    return function (v) {
      return parseFloat(v) <= version
    }
  }
}

function generateSemverFilter (sign, version) {
  version = version.split('.').map(parseSimpleInt);
  version[1] = version[1] || 0;
  version[2] = version[2] || 0;
  if (sign === '>') {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(v, version) > 0
    }
  } else if (sign === '>=') {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(v, version) >= 0
    }
  } else if (sign === '<') {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(version, v) > 0
    }
  } else {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(version, v) >= 0
    }
  }
}

function parseSimpleInt (x) {
  return parseInt(x)
}

function compare (a, b) {
  if (a < b) return -1
  if (a > b) return +1
  return 0
}

function compareSemver (a, b) {
  return (
    compare(parseInt(a[0]), parseInt(b[0])) ||
    compare(parseInt(a[1] || '0'), parseInt(b[1] || '0')) ||
    compare(parseInt(a[2] || '0'), parseInt(b[2] || '0'))
  )
}

// this follows the npm-like semver behavior
function semverFilterLoose (operator, range) {
  range = range.split('.').map(parseSimpleInt);
  if (typeof range[1] === 'undefined') {
    range[1] = 'x';
  }
  // ignore any patch version because we only return minor versions
  // range[2] = 'x'
  switch (operator) {
    case '<=':
      return function (version) {
        version = version.split('.').map(parseSimpleInt);
        return compareSemverLoose(version, range) <= 0
      }
    default:
    case '>=':
      return function (version) {
        version = version.split('.').map(parseSimpleInt);
        return compareSemverLoose(version, range) >= 0
      }
  }
}

// this follows the npm-like semver behavior
function compareSemverLoose (version, range) {
  if (version[0] !== range[0]) {
    return version[0] < range[0] ? -1 : +1
  }
  if (range[1] === 'x') {
    return 0
  }
  if (version[1] !== range[1]) {
    return version[1] < range[1] ? -1 : +1
  }
  return 0
}

function resolveVersion (data, version) {
  if (data.versions.indexOf(version) !== -1) {
    return version
  } else if (browserslist.versionAliases[data.name][version]) {
    return browserslist.versionAliases[data.name][version]
  } else {
    return false
  }
}

function normalizeVersion (data, version) {
  var resolved = resolveVersion(data, version);
  if (resolved) {
    return resolved
  } else if (data.versions.length === 1) {
    return data.versions[0]
  } else {
    return false
  }
}

function filterByYear (since, context) {
  since = since / 1000;
  return Object.keys(agents$1).reduce(function (selected, name) {
    var data = byName(name, context);
    if (!data) return selected
    var versions = Object.keys(data.releaseDate).filter(function (v) {
      return data.releaseDate[v] >= since
    });
    return selected.concat(versions.map(nameMapper(data.name)))
  }, [])
}

function cloneData (data) {
  return {
    name: data.name,
    versions: data.versions,
    released: data.released,
    releaseDate: data.releaseDate
  }
}

function mapVersions (data, map) {
  data.versions = data.versions.map(function (i) {
    return map[i] || i
  });
  data.released = data.versions.map(function (i) {
    return map[i] || i
  });
  var fixedDate = { };
  for (var i in data.releaseDate) {
    fixedDate[map[i] || i] = data.releaseDate[i];
  }
  data.releaseDate = fixedDate;
  return data
}

function byName (name, context) {
  name = name.toLowerCase();
  name = browserslist.aliases[name] || name;
  if (context.mobileToDesktop && browserslist.desktopNames[name]) {
    var desktop = browserslist.data[browserslist.desktopNames[name]];
    if (name === 'android') {
      return normalizeAndroidData(cloneData(browserslist.data[name]), desktop)
    } else {
      var cloned = cloneData(desktop);
      cloned.name = name;
      if (name === 'op_mob') {
        cloned = mapVersions(cloned, { '10.0-10.1': '10' });
      }
      return cloned
    }
  }
  return browserslist.data[name]
}

function normalizeAndroidVersions (androidVersions, chromeVersions) {
  var firstEvergreen = ANDROID_EVERGREEN_FIRST;
  var last = chromeVersions[chromeVersions.length - 1];
  return androidVersions
    .filter(function (version) { return /^(?:[2-4]\.|[34]$)/.test(version) })
    .concat(chromeVersions.slice(firstEvergreen - last - 1))
}

function normalizeAndroidData (android, chrome) {
  android.released = normalizeAndroidVersions(android.released, chrome.released);
  android.versions = normalizeAndroidVersions(android.versions, chrome.versions);
  return android
}

function checkName (name, context) {
  var data = byName(name, context);
  if (!data) throw new error('Unknown browser ' + name)
  return data
}

function unknownQuery (query) {
  return new error(
    'Unknown browser query `' + query + '`. ' +
    'Maybe you are using old Browserslist or made typo in query.'
  )
}

function filterAndroid (list, versions, context) {
  if (context.mobileToDesktop) return list
  var released = browserslist.data.android.released;
  var last = released[released.length - 1];
  var diff = last - ANDROID_EVERGREEN_FIRST - versions;
  if (diff > 0) {
    return list.slice(-1)
  } else {
    return list.slice(diff - 1)
  }
}

/**
 * Resolves queries into a browser list.
 * @param {string|string[]} queries Queries to combine.
 * Either an array of queries or a long string of queries.
 * @param {object} [context] Optional arguments to
 * the select function in `queries`.
 * @returns {string[]} A list of browsers
 */
function resolve (queries, context) {
  if (Array.isArray(queries)) {
    queries = flatten(queries.map(parse));
  } else {
    queries = parse(queries);
  }

  return queries.reduce(function (result, query, index) {
    var selection = query.queryString;

    var isExclude = selection.indexOf('not ') === 0;
    if (isExclude) {
      if (index === 0) {
        throw new error(
          'Write any browsers query (for instance, `defaults`) ' +
          'before `' + selection + '`')
      }
      selection = selection.slice(4);
    }

    for (var i = 0; i < QUERIES.length; i++) {
      var type = QUERIES[i];
      var match = selection.match(type.regexp);
      if (match) {
        var args = [context].concat(match.slice(1));
        var array = type.select.apply(browserslist, args).map(function (j) {
          var parts = j.split(' ');
          if (parts[1] === '0') {
            return parts[0] + ' ' + byName(parts[0], context).versions[0]
          } else {
            return j
          }
        });

        switch (query.type) {
          case QUERY_AND:
            if (isExclude) {
              return result.filter(function (j) {
                return array.indexOf(j) === -1
              })
            } else {
              return result.filter(function (j) {
                return array.indexOf(j) !== -1
              })
            }
          case QUERY_OR:
          default:
            if (isExclude) {
              var filter = { };
              array.forEach(function (j) {
                filter[j] = true;
              });
              return result.filter(function (j) {
                return !filter[j]
              })
            }
            return result.concat(array)
        }
      }
    }

    throw unknownQuery(selection)
  }, [])
}

var cache = { };

/**
 * Return array of browsers by selection queries.
 *
 * @param {(string|string[])} [queries=browserslist.defaults] Browser queries.
 * @param {object} [opts] Options.
 * @param {string} [opts.path="."] Path to processed file.
 *                                 It will be used to find config files.
 * @param {string} [opts.env="production"] Processing environment.
 *                                         It will be used to take right
 *                                         queries from config file.
 * @param {string} [opts.config] Path to config file with queries.
 * @param {object} [opts.stats] Custom browser usage statistics
 *                              for "> 1% in my stats" query.
 * @param {boolean} [opts.ignoreUnknownVersions=false] Do not throw on unknown
 *                                                     version in direct query.
 * @param {boolean} [opts.dangerousExtend] Disable security checks
 *                                         for extend query.
 * @param {boolean} [opts.mobileToDesktop] Alias mobile browsers to the desktop
 *                                         version when Can I Use doesn't have
 *                                         data about the specified version.
 * @returns {string[]} Array with browser names in Can I Use.
 *
 * @example
 * browserslist('IE >= 10, IE 8') //=> ['ie 11', 'ie 10', 'ie 8']
 */
function browserslist (queries, opts) {
  if (typeof opts === 'undefined') opts = { };

  if (typeof opts.path === 'undefined') {
    opts.path = path.resolve ? path.resolve('.') : '.';
  }

  if (typeof queries === 'undefined' || queries === null) {
    var config = browserslist.loadConfig(opts);
    if (config) {
      queries = config;
    } else {
      queries = browserslist.defaults;
    }
  }

  if (!(typeof queries === 'string' || Array.isArray(queries))) {
    throw new error(
      'Browser queries must be an array or string. Got ' + typeof queries + '.')
  }

  var context = {
    ignoreUnknownVersions: opts.ignoreUnknownVersions,
    dangerousExtend: opts.dangerousExtend,
    mobileToDesktop: opts.mobileToDesktop,
    env: opts.env
  };

  node.oldDataWarning(browserslist.data);
  var stats = node.getStat(opts, browserslist.data);
  if (stats) {
    context.customUsage = { };
    for (var browser in stats) {
      fillUsage(context.customUsage, browser, stats[browser]);
    }
  }

  var cacheKey = JSON.stringify([queries, context]);
  if (cache[cacheKey]) return cache[cacheKey]

  var result = uniq(resolve(queries, context)).sort(function (name1, name2) {
    name1 = name1.split(' ');
    name2 = name2.split(' ');
    if (name1[0] === name2[0]) {
      // assumptions on caniuse data
      // 1) version ranges never overlaps
      // 2) if version is not a range, it never contains `-`
      var version1 = name1[1].split('-')[0];
      var version2 = name2[1].split('-')[0];
      return compareSemver(version2.split('.'), version1.split('.'))
    } else {
      return compare(name1[0], name2[0])
    }
  });
  if (!process.env.BROWSERSLIST_DISABLE_CACHE) {
    cache[cacheKey] = result;
  }
  return result
}

function parse (queries) {
  var qs = [];
  do {
    queries = doMatch(queries, qs);
  } while (queries)
  return qs
}

function doMatch (string, qs) {
  var or = /^(?:,\s*|\s+or\s+)(.*)/i;
  var and = /^\s+and\s+(.*)/i;

  return find(string, function (parsed, n, max) {
    if (and.test(parsed)) {
      qs.unshift({ type: QUERY_AND, queryString: parsed.match(and)[1] });
      return true
    } else if (or.test(parsed)) {
      qs.unshift({ type: QUERY_OR, queryString: parsed.match(or)[1] });
      return true
    } else if (n === max) {
      qs.unshift({ type: QUERY_OR, queryString: parsed.trim() });
      return true
    }
    return false
  })
}

function find (string, predicate) {
  for (var n = 1, max = string.length; n <= max; n++) {
    var parsed = string.substr(-n, n);
    if (predicate(parsed, n, max)) {
      return string.slice(0, -n)
    }
  }
  return ''
}

function flatten (array) {
  if (!Array.isArray(array)) return [array]
  return array.reduce(function (a, b) {
    return a.concat(flatten(b))
  }, [])
}

// Will be filled by Can I Use data below
browserslist.cache = { };
browserslist.data = { };
browserslist.usage = {
  global: { },
  custom: null
};

// Default browsers query
browserslist.defaults = [
  '> 0.5%',
  'last 2 versions',
  'Firefox ESR',
  'not dead'
];

// Browser names aliases
browserslist.aliases = {
  fx: 'firefox',
  ff: 'firefox',
  ios: 'ios_saf',
  explorer: 'ie',
  blackberry: 'bb',
  explorermobile: 'ie_mob',
  operamini: 'op_mini',
  operamobile: 'op_mob',
  chromeandroid: 'and_chr',
  firefoxandroid: 'and_ff',
  ucandroid: 'and_uc',
  qqandroid: 'and_qq'
};

// Can I Use only provides a few versions for some browsers (e.g. and_chr).
// Fallback to a similar browser for unknown versions
browserslist.desktopNames = {
  and_chr: 'chrome',
  and_ff: 'firefox',
  ie_mob: 'ie',
  op_mob: 'opera',
  android: 'chrome' // has extra processing logic
};

// Aliases to work with joined versions like `ios_saf 7.0-7.1`
browserslist.versionAliases = { };

browserslist.clearCaches = node.clearCaches;
browserslist.parseConfig = node.parseConfig;
browserslist.readConfig = node.readConfig;
browserslist.findConfig = node.findConfig;
browserslist.loadConfig = node.loadConfig;

/**
 * Return browsers market coverage.
 *
 * @param {string[]} browsers Browsers names in Can I Use.
 * @param {string|object} [stats="global"] Which statistics should be used.
 *                                         Country code or custom statistics.
 *                                         Pass `"my stats"` to load statistics
 *                                         from Browserslist files.
 *
 * @return {number} Total market coverage for all selected browsers.
 *
 * @example
 * browserslist.coverage(browserslist('> 1% in US'), 'US') //=> 83.1
 */
browserslist.coverage = function (browsers, stats) {
  var data;
  if (typeof stats === 'undefined') {
    data = browserslist.usage.global;
  } else if (stats === 'my stats') {
    var opts = {};
    opts.path = path.resolve ? path.resolve('.') : '.';
    var customStats = node.getStat(opts);
    if (!customStats) {
      throw new error('Custom usage statistics was not provided')
    }
    data = {};
    for (var browser in customStats) {
      fillUsage(data, browser, customStats[browser]);
    }
  } else if (typeof stats === 'string') {
    if (stats.length > 2) {
      stats = stats.toLowerCase();
    } else {
      stats = stats.toUpperCase();
    }
    node.loadCountry(browserslist.usage, stats, browserslist.data);
    data = browserslist.usage[stats];
  } else {
    if ('dataByBrowser' in stats) {
      stats = stats.dataByBrowser;
    }
    data = { };
    for (var name in stats) {
      for (var version in stats[name]) {
        data[name + ' ' + version] = stats[name][version];
      }
    }
  }

  return browsers.reduce(function (all, i) {
    var usage = data[i];
    if (usage === undefined) {
      usage = data[i.replace(/ \S+$/, ' 0')];
    }
    return all + (usage || 0)
  }, 0)
};

var QUERIES = [
  {
    regexp: /^last\s+(\d+)\s+major\s+versions?$/i,
    select: function (context, versions) {
      return Object.keys(agents$1).reduce(function (selected, name) {
        var data = byName(name, context);
        if (!data) return selected
        var list = getMajorVersions(data.released, versions);
        list = list.map(nameMapper(data.name));
        if (data.name === 'android') {
          list = filterAndroid(list, versions, context);
        }
        return selected.concat(list)
      }, [])
    }
  },
  {
    regexp: /^last\s+(\d+)\s+versions?$/i,
    select: function (context, versions) {
      return Object.keys(agents$1).reduce(function (selected, name) {
        var data = byName(name, context);
        if (!data) return selected
        var list = data.released.slice(-versions);
        list = list.map(nameMapper(data.name));
        if (data.name === 'android') {
          list = filterAndroid(list, versions, context);
        }
        return selected.concat(list)
      }, [])
    }
  },
  {
    regexp: /^last\s+(\d+)\s+electron\s+major\s+versions?$/i,
    select: function (context, versions$1) {
      var validVersions = getMajorVersions(Object.keys(versions), versions$1);
      return validVersions.map(function (i) {
        return 'chrome ' + versions[i]
      })
    }
  },
  {
    regexp: /^last\s+(\d+)\s+(\w+)\s+major\s+versions?$/i,
    select: function (context, versions, name) {
      var data = checkName(name, context);
      var validVersions = getMajorVersions(data.released, versions);
      var list = validVersions.map(nameMapper(data.name));
      if (data.name === 'android') {
        list = filterAndroid(list, versions, context);
      }
      return list
    }
  },
  {
    regexp: /^last\s+(\d+)\s+electron\s+versions?$/i,
    select: function (context, versions$1) {
      return Object.keys(versions).reverse().slice(-versions$1).map(function (i) {
        return 'chrome ' + versions[i]
      })
    }
  },
  {
    regexp: /^last\s+(\d+)\s+(\w+)\s+versions?$/i,
    select: function (context, versions, name) {
      var data = checkName(name, context);
      var list = data.released.slice(-versions).map(nameMapper(data.name));
      if (data.name === 'android') {
        list = filterAndroid(list, versions, context);
      }
      return list
    }
  },
  {
    regexp: /^unreleased\s+versions$/i,
    select: function (context) {
      return Object.keys(agents$1).reduce(function (selected, name) {
        var data = byName(name, context);
        if (!data) return selected
        var list = data.versions.filter(function (v) {
          return data.released.indexOf(v) === -1
        });
        list = list.map(nameMapper(data.name));
        return selected.concat(list)
      }, [])
    }
  },
  {
    regexp: /^unreleased\s+electron\s+versions?$/i,
    select: function () {
      return []
    }
  },
  {
    regexp: /^unreleased\s+(\w+)\s+versions?$/i,
    select: function (context, name) {
      var data = checkName(name, context);
      return data.versions.filter(function (v) {
        return data.released.indexOf(v) === -1
      }).map(nameMapper(data.name))
    }
  },
  {
    regexp: /^last\s+(\d*.?\d+)\s+years?$/i,
    select: function (context, years) {
      return filterByYear(Date.now() - YEAR * years, context)
    }
  },
  {
    regexp: /^since (\d+)(?:-(\d+))?(?:-(\d+))?$/i,
    select: function (context, year, month, date) {
      year = parseInt(year);
      month = parseInt(month || '01') - 1;
      date = parseInt(date || '01');
      return filterByYear(Date.UTC(year, month, date, 0, 0, 0), context)
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%$/,
    select: function (context, sign, popularity) {
      popularity = parseFloat(popularity);
      var usage = browserslist.usage.global;
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%\s+in\s+my\s+stats$/,
    select: function (context, sign, popularity) {
      popularity = parseFloat(popularity);
      if (!context.customUsage) {
        throw new error('Custom usage statistics was not provided')
      }
      var usage = context.customUsage;
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%\s+in\s+(\S+)\s+stats$/,
    select: function (context, sign, popularity, name) {
      popularity = parseFloat(popularity);
      var stats = node.loadStat(context, name, browserslist.data);
      if (stats) {
        context.customUsage = { };
        for (var browser in stats) {
          fillUsage(context.customUsage, browser, stats[browser]);
        }
      }
      if (!context.customUsage) {
        throw new error('Custom usage statistics was not provided')
      }
      var usage = context.customUsage;
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%\s+in\s+((alt-)?\w\w)$/,
    select: function (context, sign, popularity, place) {
      popularity = parseFloat(popularity);
      if (place.length === 2) {
        place = place.toUpperCase();
      } else {
        place = place.toLowerCase();
      }
      node.loadCountry(browserslist.usage, place, browserslist.data);
      var usage = browserslist.usage[place];
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^cover\s+(\d*\.?\d+)%(\s+in\s+(my\s+stats|(alt-)?\w\w))?$/,
    select: function (context, coverage, statMode) {
      coverage = parseFloat(coverage);
      var usage = browserslist.usage.global;
      if (statMode) {
        if (statMode.match(/^\s+in\s+my\s+stats$/)) {
          if (!context.customUsage) {
            throw new error(
              'Custom usage statistics was not provided'
            )
          }
          usage = context.customUsage;
        } else {
          var match = statMode.match(/\s+in\s+((alt-)?\w\w)/);
          var place = match[1];
          if (place.length === 2) {
            place = place.toUpperCase();
          } else {
            place = place.toLowerCase();
          }
          node.loadCountry(browserslist.usage, place, browserslist.data);
          usage = browserslist.usage[place];
        }
      }
      var versions = Object.keys(usage).sort(function (a, b) {
        return usage[b] - usage[a]
      });
      var coveraged = 0;
      var result = [];
      var version;
      for (var i = 0; i <= versions.length; i++) {
        version = versions[i];
        if (usage[version] === 0) break
        coveraged += usage[version];
        result.push(version);
        if (coveraged >= coverage) break
      }
      return result
    }
  },
  {
    regexp: /^supports\s+([\w-]+)$/,
    select: function (context, feature) {
      node.loadFeature(browserslist.cache, feature);
      var features = browserslist.cache[feature];
      return Object.keys(features).reduce(function (result, version) {
        var flags = features[version];
        if (flags.indexOf('y') >= 0 || flags.indexOf('a') >= 0) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^electron\s+([\d.]+)\s*-\s*([\d.]+)$/i,
    select: function (context, from, to) {
      var fromToUse = normalizeElectron(from);
      var toToUse = normalizeElectron(to);
      if (!versions[fromToUse]) {
        throw new error('Unknown version ' + from + ' of electron')
      }
      if (!versions[toToUse]) {
        throw new error('Unknown version ' + to + ' of electron')
      }
      from = parseFloat(from);
      to = parseFloat(to);
      return Object.keys(versions).filter(function (i) {
        var parsed = parseFloat(i);
        return parsed >= from && parsed <= to
      }).map(function (i) {
        return 'chrome ' + versions[i]
      })
    }
  },
  {
    regexp: /^node\s+([\d.]+)\s*-\s*([\d.]+)$/i,
    select: function (context, from, to) {
      var nodeVersions = jsReleases.filter(function (i) {
        return i.name === 'nodejs'
      }).map(function (i) {
        return i.version
      });
      var semverRegExp = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,2}$/;
      if (!semverRegExp.test(from)) {
        throw new error(
          'Unknown version ' + from + ' of Node.js')
      }
      if (!semverRegExp.test(to)) {
        throw new error(
          'Unknown version ' + to + ' of Node.js')
      }
      return nodeVersions
        .filter(semverFilterLoose('>=', from))
        .filter(semverFilterLoose('<=', to))
        .map(function (v) {
          return 'node ' + v
        })
    }
  },
  {
    regexp: /^(\w+)\s+([\d.]+)\s*-\s*([\d.]+)$/i,
    select: function (context, name, from, to) {
      var data = checkName(name, context);
      from = parseFloat(normalizeVersion(data, from) || from);
      to = parseFloat(normalizeVersion(data, to) || to);
      function filter (v) {
        var parsed = parseFloat(v);
        return parsed >= from && parsed <= to
      }
      return data.released.filter(filter).map(nameMapper(data.name))
    }
  },
  {
    regexp: /^electron\s*(>=?|<=?)\s*([\d.]+)$/i,
    select: function (context, sign, version) {
      var versionToUse = normalizeElectron(version);
      return Object.keys(versions)
        .filter(generateFilter(sign, versionToUse))
        .map(function (i) {
          return 'chrome ' + versions[i]
        })
    }
  },
  {
    regexp: /^node\s*(>=?|<=?)\s*([\d.]+)$/i,
    select: function (context, sign, version) {
      var nodeVersions = jsReleases.filter(function (i) {
        return i.name === 'nodejs'
      }).map(function (i) {
        return i.version
      });
      return nodeVersions
        .filter(generateSemverFilter(sign, version))
        .map(function (v) {
          return 'node ' + v
        })
    }
  },
  {
    regexp: /^(\w+)\s*(>=?|<=?)\s*([\d.]+)$/,
    select: function (context, name, sign, version) {
      var data = checkName(name, context);
      var alias = browserslist.versionAliases[data.name][version];
      if (alias) {
        version = alias;
      }
      return data.released
        .filter(generateFilter(sign, version))
        .map(function (v) {
          return data.name + ' ' + v
        })
    }
  },
  {
    regexp: /^(firefox|ff|fx)\s+esr$/i,
    select: function () {
      return ['firefox 68', 'firefox 78']
    }
  },
  {
    regexp: /(operamini|op_mini)\s+all/i,
    select: function () {
      return ['op_mini all']
    }
  },
  {
    regexp: /^electron\s+([\d.]+)$/i,
    select: function (context, version) {
      var versionToUse = normalizeElectron(version);
      var chrome = versions[versionToUse];
      if (!chrome) {
        throw new error(
          'Unknown version ' + version + ' of electron')
      }
      return ['chrome ' + chrome]
    }
  },
  {
    regexp: /^node\s+(\d+(\.\d+)?(\.\d+)?)$/i,
    select: function (context, version) {
      var nodeReleases = jsReleases.filter(function (i) {
        return i.name === 'nodejs'
      });
      var matched = nodeReleases.filter(function (i) {
        return isVersionsMatch(i.version, version)
      });
      if (matched.length === 0) {
        if (context.ignoreUnknownVersions) {
          return []
        } else {
          throw new error(
            'Unknown version ' + version + ' of Node.js')
        }
      }
      return ['node ' + matched[matched.length - 1].version]
    }
  },
  {
    regexp: /^current\s+node$/i,
    select: function (context) {
      return [node.currentNode(resolve, context)]
    }
  },
  {
    regexp: /^maintained\s+node\s+versions$/i,
    select: function (context) {
      var now = Date.now();
      var queries = Object.keys(jsEOL).filter(function (key) {
        return now < Date.parse(jsEOL[key].end) &&
          now > Date.parse(jsEOL[key].start) &&
          isEolReleased(key)
      }).map(function (key) {
        return 'node ' + key.slice(1)
      });
      return resolve(queries, context)
    }
  },
  {
    regexp: /^phantomjs\s+1.9$/i,
    select: function () {
      return ['safari 5']
    }
  },
  {
    regexp: /^phantomjs\s+2.1$/i,
    select: function () {
      return ['safari 6']
    }
  },
  {
    regexp: /^(\w+)\s+(tp|[\d.]+)$/i,
    select: function (context, name, version) {
      if (/^tp$/i.test(version)) version = 'TP';
      var data = checkName(name, context);
      var alias = normalizeVersion(data, version);
      if (alias) {
        version = alias;
      } else {
        if (version.indexOf('.') === -1) {
          alias = version + '.0';
        } else {
          alias = version.replace(/\.0$/, '');
        }
        alias = normalizeVersion(data, alias);
        if (alias) {
          version = alias;
        } else if (context.ignoreUnknownVersions) {
          return []
        } else {
          throw new error(
            'Unknown version ' + version + ' of ' + name)
        }
      }
      return [data.name + ' ' + version]
    }
  },
  {
    regexp: /^extends (.+)$/i,
    select: function (context, name) {
      return resolve(node.loadQueries(context, name), context)
    }
  },
  {
    regexp: /^defaults$/i,
    select: function (context) {
      return resolve(browserslist.defaults, context)
    }
  },
  {
    regexp: /^dead$/i,
    select: function (context) {
      var dead = [
        'ie <= 10',
        'ie_mob <= 11',
        'bb <= 10',
        'op_mob <= 12.1',
        'samsung 4'
      ];
      return resolve(dead, context)
    }
  },
  {
    regexp: /^(\w+)$/i,
    select: function (context, name) {
      if (byName(name, context)) {
        throw new error(
          'Specify versions in Browserslist query for browser ' + name)
      } else {
        throw unknownQuery(name)
      }
    }
  }
];

// Get and convert Can I Use data

(function () {
  for (var name in agents$1) {
    var browser = agents$1[name];
    browserslist.data[name] = {
      name: name,
      versions: normalize(agents$1[name].versions),
      released: normalize(agents$1[name].versions.slice(0, -3)),
      releaseDate: agents$1[name].release_date
    };
    fillUsage(browserslist.usage.global, name, browser.usage_global);

    browserslist.versionAliases[name] = { };
    for (var i = 0; i < browser.versions.length; i++) {
      var full = browser.versions[i];
      if (!full) continue

      if (full.indexOf('-') !== -1) {
        var interval = full.split('-');
        for (var j = 0; j < interval.length; j++) {
          browserslist.versionAliases[name][interval[j]] = full;
        }
      }
    }
  }
}());
