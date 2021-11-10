const axios = require('axios');

module.exports = {

    getAllShows: async () => {
        try{
            const { data } = await axios.get("http://api.tvmaze.com/shows");
            
            if (!data || !Array.isArray(data) || data.length == 0) {
                return;
            }else{
                return data;
            }
        }catch(e){
            throw "There is no data for shows returned from TV Maze Api.";
        } 
    },

    getShowById: async (id) => {
        try {
            //console.log(id);
            if (!id || id === null || id === undefined) throw 'Show Id must be provided';

            //let parsedId = parseInt(id);
            let parsedId = id * 1;

            if (isNaN(parsedId) || typeof parsedId != 'number') throw 'Show Id is not a number. Show Id must be a positive whole number.';

            if (parsedId < 0) throw 'Show Id is a negative number. Show Id must be a positive whole number.';
        
            if (parsedId % 1 > 0) throw 'Show Id is not a whole number. Show Id must be a positive whole number.';

            const { data } = await axios.get(`http://api.tvmaze.com/shows/${parsedId}`);
            //console.log(data);
            //console.log(Object.keys(data).length); //length of keys is 23
            if(!data.name || data.name === null){
                data.name = "NA";
            }
        
            if(!data.image){
                data.image ={medium : 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png'};
            }

            if(Object.keys(data.image).length === 0){
                data.image ={medium : 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png'};
            }else if(!data.image.medium || data.image.medium === null){
                data.image ={medium : 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png'};
            }
            
            if(!data.language || data.language === null){
                data.language = "NA";
            }
            if(data.genres.length === 0){
                data.genres = [];
            }

            if(!data.rating){
                data.rating ={average:'NA'};
            }
            if(Object.keys(data.rating).length === 0){
                data.rating ={average:'NA'};
            }else if(!data.rating.average || data.rating.average === null){
                data.rating ={average:'NA'};
            }

            if(!data.network){
                data.network ={name:'NA'};
            }

            if(Object.keys(data.network).length === 0){
                data.network ={name:'NA'};
            }else if(!data.network.name || data.network.name === null){
                data.network ={name:'NA'};
            }
           
            if(!data.summary || data.summary === null){
                data.summary = "NA";
            }
            
            let showSummary = data.summary;
           
            let plainTextSummary = showSummary.replace(/(<([^>]+)>)/gi,'');     //https://stackoverflow.com/questions/1499889/remove-html-tags-in-javascript-with-regex
            data.summary = plainTextSummary;

            return data;

        } catch (e) {
            throw `Show not found for id ${id}. Enter a valid Show Id. Show Id must be a positive whole number.`;
        }
    },

    getAllShowsBySearchTerm: async (searchTerm)=>{
        
        try {
                
            if (!searchTerm) throw 'Search Term not provided. Search Term must be non empty string.';

            if (typeof searchTerm !== "string") throw 'Search Term is not a string. Search Term must be non empty string.'

            let searchTermParsed = searchTerm.trim().toLowerCase();

            if(searchTermParsed === "") throw 'Search Term is empty. Search Term must be non empty string.'

            const { data } =  await axios.get(`http://api.tvmaze.com/search/shows?q=${searchTerm}`);
            
            if (!data || !Array.isArray(data) || data.length == 0) {
                return;
            }else{
                return data;
            }

        }catch(e){
            throw 'There are no shows with searchTerm '+searchTerm+'. Make another search. Search term must be non empty string.';
        }
    }
};