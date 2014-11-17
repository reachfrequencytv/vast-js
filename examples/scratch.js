vast('http://adserver.com/vast.xml')
  .on('parsed', function(data) {
    data.ads.forEach(function(ad) {
      * ad.title
      * ad.id
      * ad.survey
      * ad.system.version; ad.system.value (?)
      * ad.impressions.forEach(function(impression) {
        * impression.id
        * impression.url
      });
      ad.creatives.forEach(function(creative) {
        * creative.sequence
        * creative.adId
        * creative.type => linear|companionAds
        * creative.companionAds.forEach(function(companionAd) {
          // ?
        });
        * creative.duration
        // type => firstQuatile
        * creative.trackingEvents['type'].forEach(function(trackingEvent) {
          * trackingEvent
        });
        * creative.adParameters:String
        // type => clickThrough|clickTracking
        * creative.videoClicks['type'].forEach(function(videoClick) {
          * videoClick.url
          * videoClick.id
        });
        * creative.mediaFiles.forEach(function(mediaFile) {
          * mediaFile.attributes...
          * mediaFile.url
        })
        * creative.extensions.forEach(function(extension) {
          extension => '<xml />'
        })
      });
    });
  })
;