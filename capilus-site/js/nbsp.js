/* petits mots jamais seuls en fin de ligne (contenu ajouté par JavaScript) */
(function(){var R=/(^|[\s («“‘"\/–—])([A-Za-zÀ-ÖØ-öø-ÿ]{1,3}|\d{1,3}) (?=\S)/g,S={SCRIPT:1,STYLE:1,TEXTAREA:1,TITLE:1};
function g(n){if(n.nodeType===3){if(n.parentNode&&!S[n.parentNode.nodeName]){var v=n.nodeValue,x=v.replace(R,'$1$2 ').replace(R,'$1$2 ');if(x!==v)n.nodeValue=x;}return;}
if(n.nodeType!==1||S[n.nodeName])return;for(var c=n.firstChild;c;c=c.nextSibling)g(c);}
g(document.body);if('MutationObserver' in window)new MutationObserver(function(m){m.forEach(function(r){r.addedNodes.forEach(g);});}).observe(document.body,{childList:true,subtree:true});})();
