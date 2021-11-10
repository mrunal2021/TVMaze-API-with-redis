const express = require('express');
const router = express.Router();
const showsData = require('../data/shows');
const redis = require("redis");
const client = redis.createClient();
const bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

router.get('/', async(req, res)=>{
    try{
        let fullPageCache = await client.getAsync(`showsList`);
    
        if (fullPageCache !== null) {
            //console.log("Cache Hit");
            res.status(200).send(fullPageCache);
        } else {
            //console.log("Cache Miss");
            const showsListData = await showsData.getAllShows();
            
            if (Array.isArray(showsListData) && showsListData.length !== 0) {
                 
                res.status(200).render(
                          "shows/home",
                          {
                              title: "TV Maze Home",
                              showsList: showsListData,
                              hasError:false
                          },
                          async (error, html) => {
                              //   console.log(typeof html);
                              //   error = "error occured";
                              if (error) res.status(500).send(error);
                              
                              await client.setAsync(`showsList`, html);
                              res.status(200).send(html);
                              //console.log(html);
                          }
                );
                
            } else {
                res.status(404).render('shows/home', { title: 'Error', error: 'There is no data for shows returned from TV Maze Api ', hasError: true});
            }
        }
        //     client.get('showsList',  async (error, showsListValue) => {
        //       if (error) res.status(500).json({ error: error });
        //       if (showsListValue != null) {
        //         console.log("Cache Hit");
        //         // return res.status(200).render("shows/home", {
        //         //   title: "TV Maze Home",
        //         //   showsName: JSON.parse(showsListValue),
        //         // });
        //           return res.status(200).send(showsListValue);
        //       } else {
        //           console.log("Cache Miss");
        //           const showsListData = await showsData.getAllShows();
        //           console.log(showsListData.length);
        //           if (Array.isArray(showsListData)) {
        //               //client.set("showsList", JSON.stringify(showsListData));
        //               res.status(200).render(
        //                   "shows/home",
        //                   {
        //                       title: "TV Maze Home",
        //                       showsList: showsListData,
        //                   },
        //                   async (error, html) => {
        //                       //   console.log(typeof html);
        //                       client.set("showsList", html);
        //                       res.send(html);
        //                       //console.log(html);
        //                   }
        //               );
        //           } else {
        //               res.status(500).render('shows/error', { title: 'error', error: e });
        //           }
        //       }
        //   });
  }catch(e){
      res.status(404).render('shows/home', {title: 'Error', error: e, hasError: true});
  }
});

router.get('/show/:id', async (req, res) => {
    try {
        //console.log("in shows/id" + req.params.id.trim());
        showId = req.params.id.trim();
        //console.log(id);

        //error checking for id
        if (!showId || showId == null || showId == undefined) return res.status(400).render('shows/singleShow', { error: 'Show Id must be supplied', title: 'Invalid show id', hasError: true });

        if (showId.indexOf('.') != -1) return res.status(400).render('shows/singleShow', { error: 'Show Id is not a valid whole number. Show id must be a positive whole number', title: 'Invalid show id', hasError: true });
        
        //let parsedId = parseInt(showId);
        
        let parsedId = showId * 1;

        if (isNaN(parsedId) || typeof parsedId != 'number') return res.status(400).render('shows/singleShow', { error: 'Show Id is not a valid number. Show Id must be a positive whole number', title: 'Invalid show Id', hasError: true });

        if (parsedId < 0) return res.status(400).render('shows/singleShow', { error: 'Show Id is a negative number. Show Id must be a positive whole number.', title: 'Invalid show Id', hasError: true });
        
        // if (parsedId = 0) return res.status(400).render('shows/singleShow', { error: 'Show id is a negative number. Show id must be a positive whole number greater', title: 'Invalid show id', hasError: true });

        if(parsedId % 1 > 0) return res.status(400).render('shows/singleShow', { error: 'Show Id is not a valid whole number. Show Id must be a positive whole number.', title: 'Invalid show Id', hasError: true });
       

        let showIdCache = await client.getAsync(`shows/${parsedId}`);

        if (showIdCache !== null) {
            //console.log('show cache hit');
            //console.log(showDetailsHtml);
            return res.status(200).send(showIdCache);
        } else {
                //console.log('show cache miss');
                const showDetails = await showsData.getShowById(parsedId);
                // console.log(showDetails);
            
                res.status(200).render(
                    'shows/singleShow',
                    { show: showDetails, title: showDetails.name, hasError: false },
                    async (error, html) => {
                        if (error) res.status(500).send(error);

                        await client.setAsync(`shows/${showId}`, html);

                        res.status(200).send(html);
                    }
                );
        }
        // client.get(`shows/${showId}`, async (error, showDetailsHtml) => {
        //     if (error) res.status(500).json({ error: error });
        //     if (showDetailsHtml != null) {
        //         console.log('show cache hit');
        //         //console.log(showDetailsHtml);
        //         return res.status(200).send(showDetailsHtml);
        //     } else {
        //         console.log('show cache miss');
        //         const showDetails = await showsData.getShowById(req.params.id.trim());
        //         // console.log("showDetails");
        //         // console.log(showDetails);
        //         res.status(200).render(
        //             'shows/singleShow',
        //             { show: showDetails, title: showDetails.name, hasError: false },
        //             async (error, html) => {
        //                 client.set(`shows/${showId}`, html);
        //                 res.send(html);
        //             }
        //         );
        //     }
        // });
        
    } catch (e) {   
        res.status(404).render(
            'shows/singleShow',
            { title: 'Show not found', error: e, hasError: true },
            async (error, html) => {
                if (error) res.status(500).send(error);

                await client.setAsync(`shows/${showId}`, html);

                res.status(404).send(html);
            });
    }
});

router.post('/search', async (req, res) => {
    try {
        
        //error checking for search term
        if(!req.body.searchTerm) return res.status(400).render('shows/searchResult', { error: 'Search Term must be supplied.', title: 'Invalid Search Term', hasError: true });
        
        if(typeof req.body.searchTerm !== "string") return res.status(400).render('shows/searchResult', { error: 'Search Term is not a string. Search term should be non empty string.', title: 'Invalid Search Term', hasError: true });

        let searchTermParsed = req.body.searchTerm.trim().toLowerCase();

        if(searchTermParsed === "") return res.status(400).render('shows/searchResult', { error: 'Search Term is empty. Search term should be non empty string.', title: 'Invalid Search Term', hasError: true });
        
        // client.zscore(`showsSearchSet`, `${searchTerm}`, async (error, res) => {
        //     if (res != null) {
        //         client.zincrby(`showsSearchSet`, 1, `${searchTerm}`);
        //     } else {
        //         client.zadd(`showsSearchSet`, 1, `${searchTerm}`);
        //     } 
        // });

        //checking if the searchTerm exist in sorted set
        let searchTermScore = await client.zscoreAsync(`showsSearchSet`, `${searchTermParsed}`);
       
        if (searchTermScore !== null) {
            await client.zincrbyAsync(`showsSearchSet`, 1, `${searchTermParsed}`);
        } else {
            await client.zaddAsync(`showsSearchSet`, 1, `${searchTermParsed}`);
        }

        //checking if the html page of searchTerm is in cache
        let searchTermCache = await client.getAsync(`search/${searchTermParsed}`);

        if (searchTermCache !== null) {
            //console.log('search cache hit');
            return res.status(200).send(searchTermCache);
        } else {
            //console.log('search cache miss');

            const showsSearchList = await showsData.getAllShowsBySearchTerm(searchTermParsed);
        
            if (Array.isArray(showsSearchList) && showsSearchList.length !== 0){
                    res.status(200).render('shows/searchResult', { 
                        showsSearchList: showsSearchList,
                        searchTerm: searchTermParsed,
                        title: 'Shows Found',
                        hasError: false
                    }, async (error, html) => {
                        if (error) res.status(500).send(error);
                        
                        await client.setAsync(`search/${searchTermParsed}`, html);
                        res.status(200).send(html);
                    });
            }else {
                    res.status(404).render('shows/searchResult',{
                        hasError: true,
                        title: 'Shows not found',
                        searchTerm: searchTermParsed,
                        error: 'Shows not found for provided search term '+searchTermParsed+' Make another search. Search term must be non empty string.'
                    },async (error, html) => {
                        if (error) res.status(500).send(error);
                        
                        await client.setAsync(`search/${searchTermParsed}`, html);
                        res.status(404).send(html);
                    });
            }  
        }
        // client.get(`search/${searchTerm}`, async (error, searchResult) => {
        //     if (error) res.status(500).json({ error: error });

        //     if (searchResult != null) {
        //         console.log('search cache hit');
        //         return res.status(200).send(searchResult);
        //     } else {
        //         console.log('search cache miss');

        //         const showsSearchList = await showsData.getAllShowsBySearchTerm(req.body.SEARCH_TERM.trim());
        
        //         if (Array.isArray(showsSearchList)){
        //             res.status(200).render('shows/searchResult', { 
        //                 showsSearchList: showsSearchList,
        //                 searchTerm: req.body.SEARCH_TERM.trim(),
        //                 title: 'Shows Found',
        //                 hasError: false
        //             }, async (error, html) => {
        //                 client.set(`search/${searchTerm}`, html);
        //                 res.send(html);
        //             });
        //         }else {
        //             res.status(404).render('shows/searchResult',{
        //                 hasError: false,
        //                 title: 'Shows not found',
        //                 searchTerm: req.body.SEARCH_TERM.trim()
        //             });
        //         }  
        //     }
        // });
    } catch (e) {
        res.status(404).render('shows/searchResult', {title:'Shows not found', error:e, hasError: true});
   }
});

router.get('/popularsearches', async (req, res) => {

    // client.zrevrange(`showsSearchSet`, 0, 9, async (error, result) => {
    //     console.log(result);
    //     if (error) res.status(500).json({ error: error });

    //     if (res != null) {
    //         res.status(200).render('shows/popularSearches', { hasError: false, title: 'Popular Searches', popularSearches: result });
    //     }

    // })

    let popularSearches = await client.zrevrangeAsync(`showsSearchSet`, 0, 9);
    // console.log(popularSearches);
    // console.log(typeof popularSearches);
    if (popularSearches.length != 0) {
        res.status(200).render('shows/popularSearches', { hasError: false, title: 'Popular Searches', popularSearches: popularSearches });
    } else {
        res.status(404).render('shows/popularSearches', { hasError: true, title: 'Popular Searches not found', error: 'There are no popular searches as of now. Make a search first.'});
    }
    
});

module.exports = router;