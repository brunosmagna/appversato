/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

 var _site           =   "https://sistema.versatozapatos.com/";
 _users             =   "/api/users";
 _delivery          =   window.localStorage.getItem("deliverycenters");
 _firstrun          =   window.localStorage.getItem("firstrun");
 _userPicture       =   window.localStorage.getItem('userPicture');
 _lastSync          =   window.localStorage.getItem('lastSync');
 _everSynced        =   window.localStorage.getItem('everSynced');
 _deviceType        =   (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/Chrome/i))  == "Chrome" ? "Chrome" : "null";
 brands             =   { selecionada : '', row : '', title : '', id : '', line : '' };
 tempToken          =   { data : '' };


var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },
    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
        $.support.cors = true;
        $.mobile.allowCrossDomainPages = true;
        ImgCache.options.debug = false;
        ImgCache.options.headers = { 'Connection': 'close' };
        ImgCache.init(function () {
            console.log('ImgCache init: success!');
        }, function () {
            console.log('ImgCache init: error! Check the log for errors');
        });

    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {

    }

};

app.initialize();

$('input, textarea')
.on('focus', function (e) {
    $('header, footer').css('position', 'absolute');
})
.on('blur', function (e) {
    $('header, footer').css('position', 'fixed');
    //force page redraw to fix incorrectly positioned fixed elements
    setTimeout( function() {
        window.scrollTo( $.mobile.window.scrollLeft(), $.mobile.window.scrollTop() );
    }, 20 );
});


$(document).on("mobileinit", function(){
    $.mobile.page.prototype.options.domCache = false;
    var db = window.openDatabase("versatto", "1.0", "data", 1000000);
    $.mobile.pageContainer = $('#container');

});

$(function() {
    FastClick.attach(document.body);
});

function ConnectionStatus() {
    var connectionStatus = false;
    connectionStatus = navigator.onLine ? 'online' : 'offline';
    if (connectionStatus == "online") { $('#connectionStatus').html('<b style="color:lightgreen">Online</b>'); } else { $('#connectionStatus').html('<b style="color:red">Offline</b>'); }
    return connectionStatus;
}

function scan(){
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            if(!result.cancelled)
            {
                if(result.format == "QR_CODE")
                {
                    tempToken.data = result.text;
                    $('#inputToken').text(result.text);
                    window.localStorage.setItem("token", result.text);
                    syncUser();
                }
            }
        },
        function (error) {
            alert(error);
        }
   );
}


$( "#first-run" ).on( "pagebeforecreate", function( event ) {

      var start = _firstrun ? $.mobile.changePage( "#brands", { transition: "fadeIn", reverse: false,  changeHash: true }) : console.log('first');
      $(document).on("click",".qrCode", scan);
      $(document).on('click', '.loginBtn', function(event) {
          if ($('#inputToken').val().length === 0) {
              navigator.notification.alert(
                  'Preencha o Campo de Segurança.',  // message
                  console.log('tudo bem'),         // callback
                  'Token de Segurança',            // title
                  'Entendido'                  // buttonName
              );
          } else {
              window.localStorage.setItem("token", $('#inputToken').val());
              tempToken.data = $('#inputToken').val();
              $.ajax({
                  url: _site+"api/user",
                  headers: {"Authorization": "Bearer " + $('#inputToken').val()},
                  method: "GET",
                  beforeSend: function() { $.mobile.loading('show', {text: "Carregando dados Usuário", textVisible: "Sincronizando Usuário"}); },
                  afterSend: function() { $.mobile.loading('hide'); },
                  success:function (data) {
                      window.localStorage.setItem("username", data.name +' '+ data.lastname);
                      window.localStorage.setItem("userpicture", data.photo);
                      window.localStorage.setItem("user_id", data.id);
                      window.localStorage.setItem("rep_id",data.representative.id);
                      window.localStorage.setItem("rep_code",data.representative.code);
                      window.localStorage.setItem("firstrun","true");
                      window.localStorage.setItem('everSynced',"false");
                      window.localStorage.setItem("firstSync","true");
                      window.localStorage.setItem("token", tempToken.data);
                      ConnectionStatus();
                      syncDataUser();
                  },
                  error: function(response) {
                      navigator.notification.alert(
                          'Não foi possível sincronizar. Verifique seu Token de Segurança e tente novamente.',  // message
                          console.log('tudo bem'),         // callback
                          'Token de Segurança',            // title
                          'Entendido'                  // buttonName
                      );

                  }
              });
          }
      });

  } );



function syncUser(){
    $.ajax({
        url: _site+"api/user",
        headers: {"Authorization": "Bearer " + tempToken.data},
        beforeSend: function() { $.mobile.loading('show', {text: "Carregando dados Usuário", textVisible: "Sincronizando Usuário"}); },
        afterSend: function() { $.mobile.loading('hide'); },
        success:function (data) {
            // Seleciona o primeiro usuário da lista pq eu nao sou palhaço
            // Seta algumas configurações básicas
            window.localStorage.setItem("username", data.name +' '+ data.lastname);
            window.localStorage.setItem("userpicture", data.photo);
            window.localStorage.setItem("user_id", data.id);
            window.localStorage.setItem("rep_id",data.representative.id);
            window.localStorage.setItem("rep_code",data.representative.code);
            window.localStorage.setItem("firstrun","true");
            window.localStorage.setItem('everSynced',"false");
            window.localStorage.setItem("firstSync","true");
            window.localStorage.setItem("token", tempToken.data);
            ConnectionStatus();
            syncDataUser();
        },
        error: function(response) {
            $.mobile.loading('hide');
            navigator.notification.alert(
                'Não foi possível sincronizar. Verifique seu Token de Segurança e tente novamente.',  // message
                console.log('tudo bem'),         // callback
                'Token de Segurança',            // title
                'Entendido'                  // buttonName
            );
        }
    })
}

function syncDataUser(){
    var token = window.localStorage.getItem("token");
    $.ajax({
        url:  _site+"api/customers/selectlist",
        headers: {"Authorization": "Bearer " + tempToken.data},
        method: "GET",
        beforeSend: function() { $.mobile.loading('show', {text: "Carregando Itens"}); },
        afterSend: function() { $.mobile.loading('hide'); },
        success:function (data) {

            console.log('[CUSTOMERS] Carregados com sucesso');

            window.localStorage.setItem("customers", JSON.stringify(data));
        },
        error: function(model, response) {
            alert('Customer: ocorreu um erro ao carregar Customers via Ajax');
        }
    });

    $.ajax({
        url:  _site+"api/brands",
        headers: {"Authorization": "Bearer " + tempToken.data},
        method: "GET",
        beforeSend: function() { $.mobile.loading('show', {text: "Carregando Itens"}); },
        success:function (data) {
            console.log('[BRANDS] Carregadas com sucesso');
            window.localStorage.setItem("brands", JSON.stringify(data));
            var datinha = JSON.stringify(data);
            $.mobile.loading('hide');
            var i;
            $.mobile.changePage( "#brands", {
                transition: "fade",
                reverse: false,
                changeHash: true,
                allowSamePageTransition : true
            });
        },
        error: function(model, response) {
            alert('Customer: ocorreu um erro ao carregar Brands via Ajax');
        }
    });
}

function syncDataUserOnline(){
    var token = window.localStorage.getItem("token");
    $.ajax({
        url:  _site+"api/customers/selectlist",
        headers: {"Authorization": "Bearer " + token},
        method: "GET",
        // beforeSend: function() { $.mobile.loading('show', {text: "Carregando Itens"}); },
        // afterSend: function() { $.mobile.loading('hide'); },
        success:function (data) {
            window.localStorage.setItem("customers", JSON.stringify(data));
        },
        error: function(model, response) {
            // alert('Customer: ocorreu um erro ao carregar Customers via Ajax');
        }
    });

    $.ajax({
        url:  _site+"api/brands",
        headers: {"Authorization": "Bearer " + token},
        method: "GET",
        // beforeSend: function() { $.mobile.loading('show', {text: "Carregando Itens"}); },
        success:function (data) {
            // console.log('[BRANDS] Carregadas com sucesso');
            window.localStorage.setItem("brands", JSON.stringify(data));
        },
        error: function(model, response) {
            // alert('Customer: ocorreu um erro ao carregar Brands via Ajax');
        }
    });
}

$(document).on("pageshow","#brands", function(event){
    var $grid = $('#sapatosList');
    $grid.isotope('remove', '.sapatoItem')
     $('#sapatosList').empty();


    var brands    =     window.localStorage.getItem("brands");
    var username  =     window.localStorage.getItem("username");
    var userphoto =     window.localStorage.getItem("userpicture");
    var marcas    =     JSON.parse(brands);

    $('.username-label').text(username);

    $('.userAvatar img').attr('src',userphoto);

    var photoUser = $('.userAvatar img');

    ImgCache.isCached(photoUser.attr('src'), function(path, success) {
        if (success) {
          console.log('[OFFLINE] - Utilizando as imagens locais')
          ImgCache.useCachedFile(photoUser);
        } else {
          console.log('[ONLINE] - Ainda precisa baixar as imagens');
          ImgCache.cacheFile(photoUser.attr('src'), function () {
            ImgCache.useCachedFile(photoUser);
          });
        }
      });

    $('#brandsList').empty();

    $.mobile.loading('show');

    i = 0;

    for (; i < marcas.length; i = i + 1) {


        $('#brandsList').append(
            '<li>'+
            '<a href="#"  data-brandId='+marcas[i].id+' data-brandRow='+i+' data-brandTitle="'+marcas[i].name+'">' +
            '<img id="#imgid'+i+'" style="width:100%; float:left;" class="cached-img" data-image="'+marcas[i].image+'" src='+marcas[i].image+'></img>' +
            '</a>' +
            '</li>'
        );
    }

    var obj = $('#brandsList li');

        $.each( obj, function(e) {

          var target = $(this).find('img');
          ImgCache.isCached(target.attr('src'), function(path, success) {
              if (success) {
                // already cached
                ImgCache.useCachedFile(target);
              } else {
                // not there, need to cache the image
                ImgCache.cacheFile(target.attr('src'), function () {
                  ImgCache.useCachedFile(target);
                });
              }
            });

        });

        $('#brandsList').listview().listview('refresh');

    $.mobile.loading('hide');
});


$(document).on( "click", "#brandsList a", function(e) {
    e.preventDefault();
    brands.selecionada = $(this).attr('data-brandId');
    brands.row = $(this).attr('data-brandRow');
    brands.title = $(this).attr('data-brandTitle');
    brands.id = $(this).attr('data-brandId');
    $.mobile.changePage( "#catalogo", {
        transition: "slide",
        reverse: false,
        changeHash: true,
    });
 });



 $(document).on("pageshow","#catalogo", function(event){
    $('#pageTitle').text(brands.title);

    var _everSynced     = window.localStorage.getItem('everSynced');

    if (_everSynced == "false") {
        $('#naoAtualizado').css('display','block');
    } else {
        $('#naoAtualizado').css('display','none');
        renderList();
    }
});

$("#catalogo").on('pagebeforecreate', function(event){

    $('.atualizaSistema').on('click', function(){
        syncDataUserOnline();
        if (ConnectionStatus() == "online") {
            if (localStorage.getItem("itensOffline") === null) {
                catalogo.sync(renderList);

            } else {
                var itensArmazenados = JSON.parse(window.localStorage.getItem("itensOffline"));
                navigator.notification.alert(
                    'Você possui '+itensArmazenados.length+' itens para enviar. Você deve enviá-los antes de atualizar seu catálogo.',  // message
                    enviaPedidoOffline(),         // callback
                    'Pedidos Armazenados',            // title
                    'Entendido'                  // buttonName
                );
                function enviaPedidoOffline() {
                    var token = window.localStorage.getItem("token");
                    var itensArmazenados = JSON.parse(window.localStorage.getItem("itensOffline"));
                    $.each(itensArmazenados, function(i, item) {
                        $.ajax({
                          url: _site+"api/orders/",
                          headers: {"Authorization": "Bearer " + token},
                          method: "POST",
                          data: item,
                          success: function(data, status) {
                            console.log("Order response" + JSON.stringify(data));
                            if (_deviceType == "Chrome") {
                                alert('Order enviada com sucesso');
                                localStorage.removeItem('itensOffline');
                            } else {
                                navigator.notification.alert(
                                    'Pedido #'+data.id+' enviado com sucesso.',  // message
                                    localStorage.removeItem('itensOffline'),         // callback
                                    'Pedido #'+data.id,            // title
                                    'Entendido'                  // buttonName
                                );
                                $.mobile.loading('hide');
                            }
                          },
                          error: function(data, status){ alert(JSON.stringify(data) +'===== STATUS ====='+ JSON.stringify(status))},
                          beforeSend: function() { $.mobile.loading('show', {text: "Carregando Itens"}) },
                          afterSend: function() { $.mobile.loading('hide'); }
                        });
                    });
                    $.mobile.loading('hide')
                }
            }

        } else {
            alert('Você precisa estar conectado à internet para fazer atualizações no catálogo.');
        }
    });
 })



// Catalogo
window.catalogo =  {

    syncURL: "https://sistema.versatozapatos.com/api/products/sync/",

    initialize: function(callback) {
        var self = this;
        this.db = window.openDatabase("versato", "1.0", "Versato Database Files", 200000);

        this.db.transaction(
            function(tx) {
                tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='sapato'", this.txErrorHandler,
                    function(tx, results) {
                        if (results.rows.length == 1) {
                            console.log('Utilizando a tabela Sapatos já existente no local');
                        }
                        else
                        {
                            console.log('A tabela Sapatos não existe no local. Criando');
                            self.createTable(callback);
                        }
                    });
            }
        )

    },

    createTable: function(callback) {
        this.db.transaction(
            function(tx) {
                var sql =
                    "CREATE TABLE IF NOT EXISTS sapato ( " +
                    "id INTEGER PRIMARY KEY, " +
                    "code VARCHAR(1000), " +
                    "brand_id INTEGER, " +
                    "line_id INTEGER, " +
                    "brand_name VARCHAR(50), " +
                    "price VARCHAR(50), " +
                    "costo VARCHAR(50)," +
                    "reference_id INTEGER, " +
                    "material_id INTEGER, " +
                    "color_id INTEGER, " +
                    "photo VARCHAR(50), " +
                    "linha_desc VARCHAR(50), " +
                    "linha_code INTEGER, " +
                    "referencia_id INTEGER, " +
                    "color_code VARCHAR(50), " +
                    "color_desc VARCHAR(50), " +
                    "material_desc VARCHAR(50), " +
                    "lastModified VARCHAR(50)," +
                    "linha INTEGER, " +
                    "grid VARCHAR(300));"
                tx.executeSql(sql);
            },
            this.txErrorHandler,
            function() {
                console.log('Tabela criada com sucesso');
                callback();
            }
        );
    },

    findAll: function(callback) {
        this.db.transaction(
            function(tx) {
                var sql = "SELECT * FROM SAPATO WHERE brand_id = '"+brands.selecionada+"' GROUP BY line_id ORDER by linha_desc ASC";
                console.log('Local SQLite database: "SELECT * FROM SAPATO"');
                tx.executeSql(sql, this.txErrorHandler,
                    function(tx, results) {
                        var len = results.rows.length,
                            sapatos = [],
                            i = 0;
                        for (; i < len; i = i + 1) {
                            sapatos[i] = results.rows.item(i);
                        }
                        callback(sapatos);
                    }
                );
            }
        );
    },

    findByLinha: function(callback) {
        this.db.transaction(
            function(tx) {
                var sql = "SELECT * FROM SAPATO WHERE brand_id = '"+brands.selecionada+"' AND line_id = '"+brands.line+"'";
                console.log('Local SQLite database: "FIND BY LINE: "' + brands.line);
                tx.executeSql(sql, this.txErrorHandler,
                    function(tx, results) {
                        var len = results.rows.length,
                            sapatoByLine = [],
                            i = 0;
                        for (; i < len; i = i + 1) {
                            sapatoByLine[i] = results.rows.item(i);
                        }
                        callback(sapatoByLine);
                    }
                );
            }
        );
    },

    getLastSync: function(callback) {
        this.db.transaction(
            function(tx) {
                var sql = "SELECT MAX(lastModified) as lastSync FROM sapato";
                tx.executeSql(sql, this.txErrorHandler,
                    function(tx, results) {
                        var lastSync = results.rows.item(0).lastSync;
                        callback(lastSync);
                    }
                );
            }
        );
    },

    sync: function(callback) {

        var self = this;
        this.getLastSync(function(lastSync){
            self.getChanges(self.syncURL, lastSync,
                function (changes) {
                    if (changes.length > 0) {

                        self.applyChanges(changes, callback);

                    } else {
                        navigator.notification.alert(
                            'No momento não existem novas atualizações',
                            $.mobile.loading('hide'),
                            'Atualização de Catálogo',
                            'Entendido'
                        );
                    }
                }
            );
        });

    },

     dropTable: function(callback) {
        this.db.transaction(
            function(tx) {
                tx.executeSql('DROP TABLE IF EXISTS sapato');
            },
            this.txErrorHandler,
            function() {
                callback();
            }
        );
    },

    getChanges: function(syncURL, modifiedSince, callback) {

        var firstSync = window.localStorage.getItem("firstSync");
            var token = window.localStorage.getItem("token");


        // Adiciona 1 segundo no horário para que não pegue novamente o último resultado sincronizado
        function increment_last(v) {
            return v.replace(/[0-9]+(?!.*[0-9])/, function(match) {
                return parseInt(match, 10)+1;
            });
        }

        // Se for o primeiro sync ele pega uma data qualquer para que baixe todos os dados do servidor

        if (firstSync == "true") {
            $.ajax({
                url: syncURL+'0000-00-00',
                beforeSend: function() { $.mobile.loading('show', {text: "Sincronizando Catálogo", textVisible: "Sincronizando Catálogo"});  },
                headers: {"Authorization": "Bearer " + token},
                dataType:"json",
                success:function (data) {
                    callback(data);
                    function onConfirmAtualizar(buttonIndex) {
                        if (buttonIndex == '1') {
                            window.localStorage.setItem("firstSync","false");
                            callback(data);
                        } else {
                            $.mobile.loading('hide');
                        }
                    }
                    navigator.notification.confirm(
                        'Foram encontrados '+data.length+' itens na base de dados. Você deseja atualizar agora?',  // message
                        onConfirmAtualizar,         // callback
                        'Atualização de Catálogo',            // title
                        ['Sim','Depois']     // buttonLabels
                    );
                },
                error: function(model, response) {
                    alert(response.responseText);
                }
            });

        } else {
            $.ajax({
                url: syncURL+increment_last(decodeURI(modifiedSince)),
                beforeSend: function() { $.mobile.loading('show', {text: "Verificando Atualizações", textVisible: "Verificando Atualizações"}); },
                headers: {"Authorization": "Bearer " + token},
                dataType:"json",
                crossDomain: true,
                success:function (data) {
                    if (data.length == 0) {
                        callback(data);
                    } else {
                        navigator.notification.confirm(
                            'Foram encontradas '+data.length+' mudanças na base de dados. Você deseja atualizar?',  // message
                            callback(data),        // callback
                            'Atualização de Catálogo',            // title
                            ['Sim','Depois']     // buttonLabels
                        );
                    }
                },
                error: function(model, response) {
                    alert(response.responseText);
                }
            });
        }
    },

    applyChanges: function(sapatos, callback) {
      var _db = this.db;
        _db.transaction(
            function(tx) {

                var l = sapatos.length;
                var sql =
                     "INSERT OR REPLACE INTO SAPATO (id, code, brand_id, brand_name, line_id, price, costo, reference_id, material_id, color_id, photo, linha_desc, referencia_id, color_code, color_desc, material_desc, lastModified, linha) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                var i;
                for (var i = 0; i < l; i++) {
                    e = sapatos[i];
                    var params = [e.id, e.code, e.brand_id, e.brand.name, e.line_id, e.price, e.cost, e.reference_id, e.material_id, e.color_id, e.photo, e.line.description, e.line_id, e.color.color, e.color.description, e.material.description, e.updated_at, e.line.code];
                    tx.executeSql(sql, params);
                }

                cacheShoes(sapatos, 0, _db, callback);
            },
            this.txErrorHandler,
            function(tx) {
                //callback();
            }
        );
    },

    syncFilters: function(){
        this.db.transaction(
            function(tx) {
                $('#select-linha').empty();
                $('#select-linha').append($('<option>', {
                    value: '*',
                    text: 'Todas las lineas'
                }));
                $('#select-cores').empty();
                $('#select-cores').append($('<option>', {
                    value: '*',
                    text: 'Todas las cores'
                }));
                $('#select-material').empty();
                $('#select-material').append($('<option>', {
                    value: '*',
                    text: 'Todos los materiales'
                }));
                var coresSQL        =   "SELECT DISTINCT MIN(color_desc) AS cores FROM sapato WHERE brand_id = '"+brands.selecionada+"' GROUP by line_id";
                var linhasSQL       =   "SELECT MIN(linha_desc) AS linha FROM sapato WHERE brand_id = '"+brands.selecionada+"' GROUP by linha_desc";
                var materiaisSQL    =   "SELECT MIN(material_desc) AS materiais FROM sapato WHERE brand_id = '"+brands.selecionada+"' GROUP by material_desc";
                tx.executeSql(coresSQL, this.txErrorHandler,
                    function(tx, results) {
                        var len = results.rows.length,
                            cores = [],
                            i = 0;
                        for (; i < len; i = i + 1) {
                            cores[i] = results.rows.item(i);
                            $('#select-cores').append($('<option>', {
                                value: '.cor'+decodeURI(cores[i].cores),
                                text: cores[i].cores
                            }));
                        }
                        cores = [];
                    }

                );
                tx.executeSql(linhasSQL, this.txErrorHandler,
                    function(tx2, linhaRes) {
                        var len = linhaRes.rows.length,
                            linhas = [],
                            i = 0;
                        for (; i < len; i = i + 1) {
                            linhas[i] = linhaRes.rows.item(i);
                            $('#select-linha').append($('<option>', {
                                value: '.linea'+linhas[i].linha,
                                text: linhas[i].linha
                            }));
                        }
                        linhas = [];
                    }
                );
                tx.executeSql(materiaisSQL, this.txErrorHandler,
                    function(tx3, materiaisList) {
                        var len = materiaisList.rows.length,
                            materiais = [],
                            i = 0;
                        for (; i < len; i = i + 1) {
                            materiais[i] = materiaisList.rows.item(i);
                            $('#select-material').append($('<option>', {
                                value: '.material'+materiais[i].materiais.split(' ').join('_'),
                                text: materiais[i].materiais
                            }));
                        }
                        materiais = [];
                    }
                );
            }
        );

    },
    txErrorHandler: function(tx) {
        console.log(tx.message);
    }
};

catalogo.initialize(function() {
});

function allCached($grid) {
	 $grid.imagesLoaded()
          .always( function( instance ) {
            $.mobile.loading('hide');
            $(document).trigger('clearMemory');
          })
          .done( function( instance ) {
            $grid.isotope('destroy');
            $grid.isotope({
                itemSelector: '.sapatoItem',
                transitionDuration: 0
            });
             $.mobile.loading('hide');
          })
          .fail( function() {
            $grid.isotope('destroy');
            $grid.isotope({
                itemSelector: '.sapatoItem',
                transitionDuration: 0
            });
            // $('#sapatosList').css('opacity','1');
          })
          .progress( function( instance, image ) { });
}

function callbackCached(list, position, $grid) {
	//if (list.length-1 === position || !list[position]) {
    console.log('dar um console aqui dentro');
    list = null;
		return allCached($grid);
	//}


	/*var imagemzinha = $(list[position]).find('img');
        // $.each( obj, function( key, value ) {
        //
        //   var target = $(this).find('img');
        //
		ImgCache.isCached(imagemzinha.attr('src'), function(path, success) {
			if (success) {
				ImgCache.useCachedFile(imagemzinha);
        imagemzinha = null;
        callbackCached(list, ++position, $grid);

			} else {
				ImgCache.cacheFile(imagemzinha.attr('src'), function () {
					ImgCache.useCachedFile(imagemzinha);
          callbackCached(list, ++position, $grid);
          imagemzinha = null;
				});
			}

		});*/
}

function cacheShoes(sapatos, posicao, _db, callback) {
    if (sapatos.length-1 === posicao || !sapatos[posicao]) {
      sapatos = null;
      callback();
      return;
    }

    var sapato = sapatos[posicao];

    ImgCache.isCached(sapato.photo, function(path, success) {
			if (success) {
				//ImgCache.useCachedFile(sapato);
        //sapato = null;

        ImgCache.getCachedFileURL(sapato.photo, function(src, newPath) {
          _db.transaction(function(tx) {
              console.log(posicao + ' / ' + sapatos.length);
              tx.executeSql("update sapato set photo = ? where id = ?", [newPath, sapato.id]);
              sapato = null;
              cacheShoes(sapatos, ++posicao, _db, callback);

          });
        });


        //callbackCached(list, ++position, $grid);

			} else {
				ImgCache.cacheFile(sapato.photo, function () {
					//ImgCache.useCachedFile(imagemzinha);
          //callbackCached(list, ++position, $grid);


          ImgCache.getCachedFileURL(sapato.photo, function(src, newPath) {
              _db.transaction(function(tx) {
                console.log(newPath);
                console.log(sapato);

                tx.executeSql("update sapato set photo=? where id=?", [newPath, sapato.id]);
                sapato = null;
                cacheShoes(sapatos, ++posicao, _db, callback);
              });
          });
				});
			}

		});
}


function renderList(sapatos) {

    var $grid = $('#sapatosList');

    $('#sapatosList').empty();

    catalogo.findAll(function(sapatos) {

        var l = sapatos.length,
          sapatosHtml = [];
        for (var i = 0; i < l; i++) {
            var sapato = sapatos[i];
            sapatosHtml.push('<div class="sapatoItem cor'+sapato.color_desc.split(' ').join('_')+' linea'+sapato.linha_desc+' material'+sapato.material_desc.split(' ').join('_')+'" >' +
                '<a href="#" data-rel="popup" id="'+[i]+'" data-transition="pop" data-position-to="origin" data-photo="'+sapato.photo+'" class="innerSapatoItem" productID="'+sapato.id+'" data-brand="'+sapato.brand_name+'" data-color="'+sapato.color_desc+'" data-linha="'+sapato.line_id+'" data-hex="'+sapato.color_code+'" data-preco="'+sapato.price+'" data-costo="'+sapato.costo+'" data-material="'+sapato.material_id+'" data-code="'+sapato.code+'"  data-strColor="'+sapato.color_desc+'" data-strGrid="2" data-strLine="'+sapato.linha_desc+'" data-strMaterial="'+sapato.material_desc+'" data-grid_id="0"> ' +
                '<section>' +
                '<div class="sapatoImage">' +
                '<img src="'+sapato.photo+'" class="cached-img">' +
                '</div>' +
                '<h1>'+sapato.linha_desc+' '+sapato.material_desc+'</h1>' +
                '<span>'+sapato.color_desc+'</span>' +
                '</section>' +
                '</a>' +
                '</div>'
            );
        }

        $('#sapatosList').append(sapatosHtml.join(""));

        sapatosHtml = [];

        window.localStorage.setItem('everSynced','true');
        // Cria a modal com o conteúdo dos sapatos
        $( ".innerSapatoItem" ).off( "click");
        $( ".innerSapatoItem" ).on( "click", function() {

            var target          = $( this ),
                linha_id        = target.attr("data-linha"),
                price           = target.attr("data-preco"),
                costo           = target.attr('data-costo'),
                color           = target.attr('data-color'),
                productid       = target.attr('productID'),
                code            = target.attr('data-code'),
                material        = target.attr('data-material'),
                colorhex        = target.attr('data-hex'),
                photo           = target.attr('data-photo'),
                img             = target.find( "img" ).attr('src'),
                short           = target.attr( "id" ),
                brand           = target.attr('data-brand'),
                strMaterial     = target.attr('data-strMaterial'),
                strColor        = target.attr('data-strColor'),
                strLine         = target.attr('data-strLine'),
                closebtn        = '';

                brands.line     = linha_id;

                popup = '<div data-role="popup" data-tolerance="30,30" id="popup-' + short + '" data-short="' + short +'" class="recebeDadosSapato" ><div data-role="main">' +
               '<a href="#" class="ui-btn ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right" id="ui-close-modal-master" style="z-index:999999999">Close</a>' +
               '<figure><img src="'+img+'" class="photo" style="transform: scale(0.8)"/><div class="recebeLinha"></div></figure>' +
               '<h4 style="width:100%; text-align:center; float:left;" class="h4TituloSapato">'+strLine+' '+strMaterial+' '+strColor+'</h4>'+
               '<ul class="dadosSapato"><li>Preço</li>' +
               '<li>AR$ <b class="productPriceSpan">'+ price +'</b></li><li>Quantidade</li>' +
               '<li><input type="number" min="0" max="100" name="recebeQtd" class="recebeQtd" value="1" readonly><a href="#" class="botaoQtd addMinusQtd ui-alt-icon ui-nodisc-icon ui-btn ui-icon-minus ui-btn-icon-notext ui-corner-all" style="margin-top:0px;"></a><a href="#" class="botaoQtd addPlusQtd ui-alt-icon ui-nodisc-icon ui-btn ui-icon-plus ui-btn-icon-notext ui-corner-all" data-func="plus" style="margin-top:0px;"></a></li>' +
               '<li class="tareaMaster">Tarea</li>' +
               '<li class="tarea"><select name="recebeGrid" style="width:50%" class="recebeGrid" data-mini="true" data-inline="true"><option value="1">Tarea A</option><option value="2">Tarea B</option><option value="3">Tarea D</option><option value="4">Tarea H</option></select> </li>' +
               '<li>Desconto de Representante ( % )</li>' +
               '<li><input type="number"  min="0" max="5" name="descontoRepresentante" class="descontoRepresentante" value="0" readonly><a href="#" class="botaoQtd2 addMinusQtd ui-alt-icon ui-nodisc-icon ui-btn ui-icon-minus ui-btn-icon-notext ui-corner-all" style="margin-top:0px;"></a><a href="#" class="botaoQtd2 addPlusQtd ui-alt-icon ui-nodisc-icon ui-btn ui-icon-plus ui-btn-icon-notext ui-corner-all" data-func="plus" style="margin-top:0px;"></a></li>' +
               '<li>Desconto de Cliente ( % )</li>' +
               '<li><input type="number"  min="0" max="100" name="descontoCliente" class="descontoCliente" value="0" readonly><a href="#" class="botaoQtd3 addMinusQtd ui-alt-icon ui-nodisc-icon ui-btn ui-icon-minus ui-btn-icon-notext ui-corner-all" style="margin-top:0px;"></a><a href="#" class="botaoQtd3 addPlusQtd ui-alt-icon ui-nodisc-icon ui-btn ui-icon-plus ui-btn-icon-notext ui-corner-all" data-func="plus" style="margin-top:0px;"></a></li>' +
               '</ul>' +
               '<a href="#" class="addPedido"  data-costo="'+costo+'" productid="'+productid+'" data-photo="'+photo+'" data-price="'+price+'"  data-code="'+code+'" data-material="'+material+'" data-strColor="'+strColor+'" data-strLine="'+strLine+'" data-strMaterial="'+strMaterial+'" data-strGrid="0" data-grid_id="0">ADICIONAR AO PEDIDO</a>'
               '</div>';



               catalogo.findByLinha(function(sapatoByLine) {
                 var itens = sapatoByLine.length;

                 for (var i = 0; i < itens; i++) {
                   var itensMaster = sapatoByLine[i];

                   $('.recebeLinha').append('<a href="#" data-rel="popup" id="'+[i]+'" style="margin-top:10px;" data-transition="pop" data-position-to="origin"  data-photo="'+itensMaster.photo+'" class="innerSapatoItemAd" productID="'+itensMaster.id+'" data-brand="'+itensMaster.brand_name+'" data-color="'+itensMaster.color_desc+'" data-linha="'+itensMaster.line_id+'" data-hex="'+itensMaster.color_code+'" data-preco="'+itensMaster.price+'" data-costo="'+itensMaster.costo+'" data-material="'+itensMaster.material_id+'" data-code="'+itensMaster.code+'"  data-strColor="'+itensMaster.color_desc+'" data-strGrid="2" data-strLine="'+itensMaster.linha_desc+'" data-strMaterial="'+itensMaster.material_desc+'" data-grid_id="0"> ' +
                       '<div class="sapatoImage" style="overflow:hidden; border:1px solid #e2e2e2">' +
                       '<img src="'+itensMaster.photo+'" style="width: 75%; margin-top:10px; transform: scale(0.8)" class="imagePremium">' +
                       '</div>'+
                       '</a>'
                   );
                 }


                 $('.innerSapatoItemAd').off('click');
                 $('.innerSapatoItemAd').on("click", function(){
                   var esse = $( this );
                   var novo_linha_id        = esse.attr("data-linha");
                   var novo_price           = esse.attr("data-preco");
                   var novo_costo           = esse.attr('data-costo');
                   var novo_color           = esse.attr('data-color');
                   var novo_productid       = esse.attr('productID');
                   var novo_code            = esse.attr('data-code');
                   var novo_material        = esse.attr('data-material');
                   var novo_colorhex        = esse.attr('data-hex');
                   var novo_photo           = esse.attr('data-photo');
                   var novo_img             = esse.find( "img" ).attr('src');
                   var novo_short           = esse.attr( "id" );
                   var novo_brand           = esse.attr('data-brand');
                   var novo_strMaterial     = esse.attr('data-strMaterial');
                   var novo_strColor        = esse.attr('data-strColor');
                   var novo_strLine         = esse.attr('data-strLine');

                   $('#popup-' + short).find('.photo').attr('src',novo_photo);

                   $('#popup-' + short).find('a.addPedido').attr({
                     "data-linha" : novo_linha_id,
                     "data-preco" : novo_price,
                     "data-costo" : novo_costo,
                     "data-color" : novo_color,
                     "productID"  : novo_productid,
                     "data-code"  : novo_code,
                     "data-material" : novo_material,
                     "data-hex" : novo_colorhex,
                     "data-photo" : novo_photo,
                     "id" : novo_short,
                     "data-brand" : novo_brand,
                     "data-strMaterial" : novo_strMaterial,
                     "data-strColor" : novo_strColor,
                     "data-strLine" : novo_strLine
                   });
                   $('#popup-' + short).find('.productPriceSpan').html(novo_price);
                   $('#popup-' + short).find('.h4TituloSapato').html(novo_strLine +' '+ novo_strMaterial +' '+ novo_strColor)
                 })
               });
              //  Fim catalogo.findByLinha

              //  $('input[type="number"]').off('focusin focus');
              //  $('input[type="number"]').on('focusin focus', function(e){
              //     e.preventDefault();
              //   })

               $.mobile.activePage.append(popup).trigger("pagecreate");




               $('.recebeQtd').val('1');
               $('.descontoRepresentante').val('0');
               $('.descontoCliente').val('0');

              //  $(document).on('popupbeforeposition', "#popup-" + short, function(event, ui) {
                //  $('#popup-' + short + '-popup').css({
                //     'position' : 'fixed',
                //     'top' : '80px',
                //     'width' : '96%',
                //     'left' : '2%',
                //     'max-width' : '96%'
                //  });
              //  });

               $(document).on('popupafteropen', "#popup-" + short, function(event, ui) {
                  $('#popup-' + short + '-popup').css({
                     'position' : 'fixed',
                        'top' : '80px',
                     'width' : '96%',
                     'left' : '2%',
                     'max-width' : '96%'
                  });

                  $(this).popup("reposition",{
                      x: 80,
                      y: 115,
                      positionTo: "window"
                  });

                  $('#ui-close-modal-master').off("click");
                  $('#ui-close-modal-master').on("click", function() {
                    $('[data-role="popup"]').popup("close");
                    $('#popup-' + short).popup("close");
                  });

                    $('body').css('overflow', 'hidden').on('touchmove', function(e) {
                         if (!$(e.target).parents('.recebeLinha')[0]) {
                              e.preventDefault();
                          }

                    });
                }).on('popupafterclose', "#popup-" + short, function(event, ui) {
                    $('body').css('overflow', 'auto').off('touchmove');
                });

              $( "#popup-" + short ).popup().popup( "open", {positionTo: 'window', corners: false, tolerance: "30, 15, 30, 15", transition: "pop", y: 0} );

                $( document ).on( "popupafterclose", "#popup-"+ short, function() {
                    $('.recebeQtd').val('1');
                    $('.descontoRepresentante').val('0');
                    $('.descontoCliente').val('0');
                    $( this ).remove();
                    popup = null;
                });



                $('.botaoQtd').off("click");
                $('.botaoQtd').on("click", function() {

                  var $button = $(this);
                  var oldValue = $('.recebeQtd').val();

                  if ($button.attr('data-func') == "plus") {
                    var newVal = parseFloat(oldValue) + 1;
                  } else {
                   // Don't allow decrementing below zero
                    if (oldValue > 0) {
                      var newVal = parseFloat(oldValue) - 1;
                    } else {
                      newVal = 0;
                    }
                  }
                  $('.recebeQtd').val(newVal);
                });

                $('.botaoQtd2').off("click");
                $('.botaoQtd2').on("click", function() {

                  var $button = $(this);
                  var oldValue = $('.descontoRepresentante').val();

                  if ($button.attr('data-func') == "plus") {
                    if (oldValue >= 5) {
                      newVal = oldValue;
                    } else {
                      var newVal = parseFloat(oldValue) + 1;
                    }
                  } else {
                   // Don't allow decrementing below zero
                    if (oldValue > 0) {
                      var newVal = parseFloat(oldValue) - 1;
                    } else {
                      newVal = 0;
                    }
                  }
                  $('.descontoRepresentante').val(newVal);
                });

                $('.botaoQtd3').off("click");
                $('.botaoQtd3').on("click", function() {

                  var $button = $(this);
                  var oldValue = $('.descontoCliente').val();

                  if ($button.attr('data-func') == "plus") {
                    var newVal = parseFloat(oldValue) + 1;
                  } else {
                   // Don't allow decrementing below zero
                    if (oldValue > 0) {
                      var newVal = parseFloat(oldValue) - 1;
                    } else {
                      newVal = 0;
                    }
                  }
                  $('.descontoCliente').val(newVal);
                });
        });

        // $('#sapatosList').css('opacity','0');

        $.mobile.loading('show', {text: "Carregando Catálogo", textVisible: "Carregando Catálogo"});

        var obje = $('#sapatosList div');

        callbackCached(obje, 0, $grid);

        $('.filters-select').off( 'change');
        $('.filters-select').on( 'change', function() {
          var filterValue = this.value;
          filterValue = filterValue;
          $grid.isotope({ filter: filterValue.split(' ').join('_') });
        });

        $(document).off('clearMemory');
        $(document).on('clearMemory', function(){
          console.log("clearing memory");
          obje = null;
        });

        //$(document).trigger('clearMemory');

        catalogo.syncFilters();
        sapatos = null;
    });

}

var orderProducts = [];
var id_representante = window.localStorage.getItem('rep_id');


// Configura o objeto para a Order

var Order = function(id, cost, price, total, overalldiscount, representative_commission, representative_discount, customer_discount, status_id, customer_id, representative_id, orderProducts) {

    this.id                             = 1;
    this.cost                           = 0;
    this.price                          = 0;
    this.total                          = 0;
    this.overalldiscount                = 0;
    this.representative_commission      = 0;
    this.representative_discount        = 0;
    this.customer_discount              = 0;
    this.status_id                      = 1;
    this.customer_id                    = 1;
    this.representative_id              = id_representante;
    this.products                       = orderProducts;
    this.deliverycenter_id              = 1;
    this.comment                        = " ";

    $('.valorTotalNumber b').html(this.total);
    $('.itensPedidoNumber').html(orderProducts.length);

};

// Cria o objeto de Order

var order = new Order("1", 0, 0, 0, 0, 0, 0, 0, 0, 0, id_representante, orderProducts, 0, "");

// Configura o objeto para os produtos que irão na Order

var Product = function(product_id, code, cost, price, photo, chk_client_discount, chk_representative_discount, representative_discount, total, discount, grid_id, strGrid, strColor, strMaterial, strLine, amount, customer_discount, repcom) {
    this.product_id                     = product_id;
    this.code                           = code;
    this.cost                           = cost;
    this.photo                          = photo;
    this.price                          = price;
    this.chk_client_discount            = chk_client_discount;
    this.chk_representative_discount    = chk_representative_discount;
    this.representative_discount        = representative_discount;
    this.total                          = total;
    this.discount                       = discount;
    this.grid_id                        = grid_id;
    this.strGrid                        = strGrid;
    this.strColor                       = strColor;
    this.strMaterial                    = strMaterial;
    this.strLine                        = strLine;
    this.amount                            = amount;
    this.customer_discount              = customer_discount;
    this.representative_commission      = repcom;
};

// Cria o objeto de Produto

var product = new Product(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2 ,0, 0, 0, 0, 0, 0);

// Calculadora do Bruninho


function calcGeneralDiscount(){
    var client_discount         = order.customer_discount         ? order.customer_discount         : 0;
    var representative_discount = order.representative_discount ? order.representative_discount : 0;
    return parseFloat(client_discount) + parseFloat(representative_discount);
}

function calcIndidualDiscount(product){
    var client_discount         = product.discount         ? product.discount         : 0;
    var representative_discount = product.representative_discount ? product.representative_discount : 0;
    return parseFloat(client_discount) + parseFloat(representative_discount);
}

function calcFinalPrice(product) {

    var finalPrice                 =    {finalPrice: 0, totalDiscount: 0};
    var finalDiscount              =    0;
    var totalGeneralDiscount       =    0;
    var totalIndividualDiscount    =    0;
    var amount                        =    product.amount ? product.amount : 1;

    totalGeneralDiscount           =    calcGeneralDiscount();
    totalIndividualDiscount        =    calcIndidualDiscount(product);

    finalDiscount = totalIndividualDiscount ? totalIndividualDiscount : totalGeneralDiscount;

    finalPrice.totalDiscount       =    ((parseFloat(finalDiscount)/100) * parseFloat(product.price));
    finalPrice.finalPrice          =    (parseFloat(product.price) - parseFloat(finalPrice.totalDiscount)) * amount;;

    return finalPrice;
}

// Atualiza os valores

function updateOrderValues() {

    order.cost              = 0;
    order.price             = 0;
    order.total             = 0;
    order.overalldiscount   = 0;
    order.representative_commission = 0;

    for (var i = 0; i < orderProducts.length; i++) {
        order.cost                      += parseFloat(orderProducts[i].cost);
        order.price                     += parseFloat(orderProducts[i].price);
        order.overalldiscount           += parseFloat(orderProducts[i].customer_discount);
        order.representative_commission += parseFloat(orderProducts[i].price * orderProducts[i].representative_discount / 100);
        order.total += parseFloat(order.price - order.overalldiscount);
    }
}

function updateBySlider() {

    order.cost              = 0;
    order.price             = 0;
    order.total             = 0;
    order.overalldiscount   = 0;

    for (var i = 0; i < orderProducts.length; i++) {

        var finalPrice               = calcFinalPrice(orderProducts[i]);

        orderProducts[i].total       = finalPrice.finalPrice;
        orderProducts[i].customer_discount    = finalPrice.totalDiscount;
        order.cost                  += parseFloat(orderProducts[i].cost);
        order.price                 += parseFloat(orderProducts[i].price);
        order.overalldiscount       += parseFloat(orderProducts[i].customer_discount);
        order.total                 += parseFloat(order.price - order.overalldiscount);


        $('tr[data-id="'+orderProducts[i]+'"]').children('td.itemDiscountTD').html(Math.round(orderProducts[i].discount).toFixed(2));
        $('tr[data-id="'+orderProducts[i]+'"]').children('td.itemTotalTD').html(Math.round(orderProducts[i].total).toFixed(2));
    }

    var new_number = Math.round(order.total).toFixed(2);
    $('.valorTotalNumber b').html(new_number);
}

function refreshProductList(){

    var recebe = $('#recebeListinha');

    recebe.empty();

    $.each(orderProducts, function(i, item) {
        recebe.append('<tr data-id="'+i+'">'+
          '<th>'+(i + 1)+'</th>'+
          '<td>'+item.strLine+' - '+item.strMaterial+' - '+item.strColor+'</td>'+
          '<td>'+item.grid_id+'</td>'+
          '<td>'+item.amount+' <small style="color:#e1e1e1">x 12</small></td>'+
          '<td>AR$ '+(item.price / 12)+'</td>'+
          '<td class="itemDiscountTD">AR$ '+Math.round(item.customer_discount).toFixed(2)+'</td>'+
          '<td class="itemTotalTD">AR$ '+Math.round(item.total).toFixed(2)+'</td>'+
          '<td ><a href="#" data-id="'+i+'" class="deletaOrder ui-alt-icon ui-nodisc-icon ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all" style="color:white !important"></a></td>'+
          '</tr>');
    });

    var new_number = Math.round(order.total).toFixed(2);

    $('.valorTotalNumber b').html(new_number);
    $('.itensPedidoNumber').html(orderProducts.length);
}



$(document).on('click', '.addPedido', function() {

    var preco                       =   $(this).attr('data-price');
    var custo                       =   $(this).attr('data-costo');
    var productID                   =   $(this).attr('productID');
    var code                        =   $(this).attr('data-code');
    var descontoRepresentante       =   $('.descontoRepresentante').val();
    var descontoCliente             =   $('.descontoCliente').val();
    var recebeQtd                   =   $('.recebeQtd').val();
    var tarea                       =   $('.recebeGrid option:selected').val();
    var photo                       =   $(this).attr('data-photo');
    var strLine                     =   $(this).attr('data-strLine');
    var strMaterial                 =   $(this).attr('data-strMaterial');
    var strColor                    =   $(this).attr('data-strColor');
    // var grid_id                  =   $(this).attr('data-grid_id');
    var strGrid                     =   $(this).attr('data-strGrid');


    product.id                              = productID;
    product.cost                            = parseFloat(custo);
    product.price                           = (parseFloat(preco) * 12) ;
    product.discount                        = parseFloat(descontoCliente);
    product.representative_discount         = parseFloat(descontoRepresentante);
    product.grid_id                         = tarea;
    product.amount                             = recebeQtd;
    order.representative_id                 = window.localStorage.getItem('rep_id');

    var finalPrice                          = calcFinalPrice(product);

    function escreveObjeto(obj, list) {
        orderProducts.push({
          product_id:                   product.id,
          code:                         code,
          strLine:                      strLine,
          strMaterial:                  strMaterial,
          strColor:                     strColor,
          cost:                         product.cost,
          price:                        product.price,
          chk_client_discount:          false,
          discount:                     parseFloat(descontoCliente) ,
          representative_discount:      descontoRepresentante,
          chk_representative_discount:  false,
          total:                        finalPrice.finalPrice,
          customer_discount:            finalPrice.totalDiscount,
          grid_id:                      product.grid_id,
          strGrid:                      strGrid,
          amount:                       parseFloat(descontoRepresentante),
          representative_commission:    parseFloat(product.price * product.representative_discount / 100)
        });
    }
    escreveObjeto(product.id, orderProducts);
    updateOrderValues();
    refreshProductList();
    $('.addPedido').css('background','#1D1F1B');
    setTimeout(function(){
        $('.addPedido').css('background','#2D5F8B');
    }, 1000);
});

// Add To Favoritos
// favorito.id
// push to favoritos list (criar um banco somente para isso);


$(document).on('click','.deletaOrder', function(){
    product.cost                            = 0;
    product.price                           = 0;
    product.discount                 = 0;
    product.representative_discount         = 0;
    product.amount                             = 0;

    var indexDelete = $(this).attr('data-id');

    orderProducts.splice(indexDelete, 1);

    updateOrderValues();
    refreshProductList();
});

function executaSalvaOrderToList(){
    var itensOffline = JSON.parse(localStorage.getItem('itensOffline')) || [];
    itensOffline.push(order);
    localStorage.setItem('itensOffline', JSON.stringify(itensOffline));
    resetaOrders();
}

function salvaOrderToList(){
    if (_deviceType == "Chrome") {
        alert('Você não está conectando. Você deseja salvar o pedido para enviar quando se conectar novamente?');
        executaSalvaOrderToList();
    } else {
        navigator.notification.alert(
            'Você não está conectado na internet. O pedido foi salvo no dispositivo e será enviado assim que você se conectar na internet novamente.',  // message
            executaSalvaOrderToList(),         // callback
            'Sem conexão',            // title
            'Entendido'                  // buttonName
        );
    }
}


function salvaOrder(){

    if (_deviceType == "Chrome") {
        salvaOrderToList();
    } else {
        navigator.notification.alert(
            'Pedido #'+data.id+' enviado com sucesso.',  // message
            salvaOrderToList(),         // callback
            'Pedido #'+data.id,            // title
            'Entendido'                  // buttonName
        );
    }

}

function resetaOrders() {

    $('#recebeListinha').empty();
    $('.valorTotalNumber b').html('0');
    $('.itensPedidoNumber').html('0');
    $('#popupMenuSpan').html('Selecione');

    orderProducts = [];

    order.customer_discount = 0;
    order.cost = 0;
    order.customer_id = 0;
    order.deliverycenter_id = 0;
    order.overalldiscount = 0;
    order.price = 0;
    order.products = orderProducts;
    order.representative_discount = 0;
    order.discount = 0
    order.total = 0;

    $.mobile.changePage( "#catalogo", {
        transition: "fade",
        reverse: false,
         allowSamePageTransition : true,
        changeHash: true
    });
}


function enviaOrder(){

    var token = window.localStorage.getItem("token");

    if ($('#popupMenuSpan').text() === "Selecione") {
      navigator.notification.alert(
          'Você deve selecionar um Customer',  // message
          console.log('OK'),         // callback
          'Erro de Envio',            // title
          'Entendido'                  // buttonName
      );
    } else {
              $.ajax({
                url: _site+"api/orders/",
                headers: {"Authorization": "Bearer " + token},
                method: "POST",
                data: order,
                // contentType: 'application/json',
                // dataType: 'json',
                success: function(data, status) {
                  if (_deviceType == "Chrome") {
                      alert('Order enviada com sucesso');
                      resetaOrders();
                  } else {
                      navigator.notification.alert(
                          'Pedido #'+data.id+' enviado com sucesso.',  // message
                          resetaOrders(),         // callback
                          'Pedido #'+data.id,            // title
                          'Entendido'                  // buttonName
                      );
                  }
                },
                error: function(data, status){
                  console.log(JSON.stringify(data) +'===== STATUS ====='+ JSON.stringify(status));
                  navigator.notification.alert(
                      'Não foi possível enviar o pedido. Por favor, tente novamente.',  // message
                      $.mobile.loading('hide'),         // callback
                      'Erro',            // title
                      'Entendido'                  // buttonName
                  );
                },
                beforeSend: function() { $.mobile.loading('show', {text: "Carregando Itens"}) },
                afterSend: function() { $.mobile.loading('hide') }
              });
    }

}


$(document).on("pageinit","#pedidosBefore",function(){

    var customers = JSON.parse(window.localStorage.getItem('customers')); $('#customerBox').empty();

    $('#deliveryBox').empty();

    $('#customerBox').append($('<option>', {
        value: 'selecione',
        text: 'Customer'
    }));

    $('#deliveryBox').append($('<option>', {
        value: 'selecione',
        text: 'Delivery'
    }));

    $('#popupMenuSpan').html('Selecione');


    $.each(customers, function(i, item) {
        // $('#customerBox').append($('<option>', {
        //     value: item.value,
        //     text: item.label
        // }));
        $('#data-customers').append('<li data-filtertext="'+item.label+'" data-value="'+item.value+'" id="blink"><a href="#" id="alink" data-value="'+item.value+'">' + item.label + '</a></li>').listview('refresh');
    });

     $(document).on('click',"#blink", function(){

        var customerVal = $(this).attr('data-value');

         var token = window.localStorage.getItem("token");
         order.customer_id = $(this).attr('data-value');
         $('#popupMenuSpan').html($(this).attr('data-filtertext'));
         $.ajax({
              url: _site+"api/deliverycenters/selectlist/"+customerVal,
              headers: {"Authorization": "Bearer " + token},
              beforeSend: function() { $.mobile.loading('show'); },
              success:function (data) {

                  $('#deliveryBox').empty();

                  for (var i = 0; i < data.length; i = i + 1) {
                     $('#deliveryBox').append($('<option>', {
                          value: data[i].value,
                          text: data[i].label
                      }));
                  }

                  $.mobile.loading('hide');

              },
              error: function(model, response) {
                  $('#deliveryBox').append($('<option>', {
                       value: '',
                       text: ''
                   }));

                   $.mobile.loading('hide');
              }
          });

          $('[data-role="popup"]').popup("close");

      });

    $( "#descontoClienteSlider" ).on( 'change', function( event ) {

        $("#descontoClienteRepresentante").attr('max', 100 - $(this).val());

        order.customer_discount = $(this).val();

        updateBySlider();

    });

    $( "#descontoClienteRepresentante" ).on( 'change', function( event ) {

        $("#descontoClienteSlider").attr('max', 100 - $(this).val());

        order.representative_discount = $(this).val();

        updateBySlider();

    });

    $(document).on('change','#deliveryBox',function(){
        order.deliverycenter_id = this.value;
    });

});

$(document).on('click', '#verPedido', function(){
    $.mobile.changePage( "#pedidosBefore", {
        transition: "slide",
        reverse: false,
        changeHash: true,
    });
});

$(document).on( "click", "#efetuarPedido", function(){ navigator.onLine ? enviaOrder() : salvaOrderToList() });
