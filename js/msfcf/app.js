var canvas = Snap("#canvas");
canvas.attr({width: '800px', height: '600px'});

var nombre_de_mouvements = 0;
var message = document.getElementById('message');
var couleurs = ['red', 'blue', 'blue', 'white', 'red', 'white', 'white', 'blue', 'blue', 'red', 'white', 'red'];
var wagons = [];


function deplacer() {
    var couleur = this.attr('fill');
    var debut = wagons.indexOf(this);
    var copie = wagons.slice();

    for(var i=debut; i<wagons.length-1; i++) {
        var wagon = wagons[i];
        var suivant = wagons[i+1];
        wagon.attr({fill: suivant.attr('fill')});
    }

    wagons[wagons.length-1].attr({fill: couleur});
    
    // verifier que le motif est respecté
    var motif = ['rgb(0, 0, 255)', 'rgb(255, 255, 255)', 'rgb(255, 0, 0)'];
    var ok = true;
    for(var i=0; i<12; i++) {
        var fill = wagons[i].attr('fill');
        if (fill != motif[i % 3]) {
            // rupture dans le motif
            // sortie avec erreur
            ok = false;
            break;
        }
    }

    if(ok) {
        message.innerHTML = '<p>Félicitation vous avez réaliser le motif!!<p></p>Pour recommencer tapez <kbd>Ctrl</kbd> + <kbd>R</kbd> ou <kbd>F5</kbd>.</p>';
    } else {
        nombre_de_mouvements = nombre_de_mouvements + 1;
        if(nombre_de_mouvements == 1) {
            message.textContent = 'un mouvement!';
        } else {
            message.textContent = nombre_de_mouvements + ' mouvements';
        }
    }
}



for (var i=0; i<12; i++) {
    var x = i * 40 + 45;
    var y = -i * 20 + 300;
    var wagon = canvas.circle(x, y, 20);
    var couleur = couleurs[i];
    
    wagon.attr({
        fill: couleur,
        stroke: "#000",
        strokeWidth: 2,
    });
    
    wagon.node.onclick = deplacer.bind(wagon);
    wagons.push(wagon);
}
