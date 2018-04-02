<?php

$intranetPath = "intranet.lagtinget.ax";
$intranetFilePath = "/var/www/" . $intranetPath;
require "../" . $intranetPath . "/helpers.inc.php";

?>
<!DOCTYPE html>
<html lang="en" data-ng-app="client">
	<head>
		<base href="/">
		<meta charset="utf-8" />
		<title>Ålands Lagting | Klient </title>
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta content="width=device-width, initial-scale=1" name="viewport" />
		<meta content="Intranet" name="description" />
		<meta content="Ålands lagting" name="author" />
		<link href="//fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&subset=all" rel="stylesheet" type="text/css" />
		<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />

		<link href="//<?=$intranetPath?>/assets/global/plugins/bootstrap/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
		<link href="//bootswatch.com/spacelab/bootstrap.min.css" rel="stylesheet" type="text/css" />

		<link href="//cdnjs.cloudflare.com/ajax/libs/angular-loading-bar/0.9.0/loading-bar.min.css" rel="stylesheet" type="text/css" />

		<link rel="shortcut icon" href="favicon.ico" />
		<link rel="stylesheet" href="/assets/angular-ui-notification.min.css" />
		<link rel="stylesheet" href="https://client.lagtinget.ax/assets/css/bootwatch.slate.3.3.7.min.css" />
		<link rel="stylesheet" href="/assets/custom/common.css" />
		<link rel="stylesheet" href="/assets/custom/client.css" />


		<meta name="apple-mobile-web-app-capable" content="yes" />

	</head>

	<body ng-cloak>

		<div id="header" class="navbar navbar-default" ng-controller="client.topnav.controller as vm">
			<div class="container-fluid">
				<div class="row">
					<div class="col col-md-8">
						<h3 ng-if="vm.currentSeating">
							{{ vm.currentSeating.title }} (<span ng-if="!vm.isActive">kommande plenum</span><span ng-if="vm.isActive">Plenum pågår</span>)
						</h3>
					</div>
					<div class="col col-md-4">
						<h3 class="pull-right">{{ vm.user.member.name }}</h3>
					</div>
<!--
					<div class="col col-md-12 text-center">
						<h3>{{ vm.user.member.name }}</h3>
						<h4>12:34</h4>
					</div>
-->
				</div>
			</div>
		</div>

		<div id="wrapper">

			<div ng-controller="client.main.controller as vm">
				<div ng-include="'/client/client.main/main.tpl.html'"></div>
			</div>
<!--
			<div id="sidebar-wrapper" class="transformable" ng-class="{ 'col-md-3' : vm.narrowCol, 'col-md-9' : !vm.narrowCol }" ng-controller="client.main.right.controller as vm">
				<div id="sidebar" class="col-md-12">
				    <div ng-include="'/client/client.main/right.tpl.html'"></div>
				</div>
			</div>
			-->


		</div>




		<script src="//ws.lagtinget.ax:8080/socket.io/socket.io.js"></script>

		<script src="//<?=$intranetPath?>/assets/global/plugins/lodash.min.js" type="text/javascript"></script>

		<script src="//<?=$intranetPath?>/assets/custom/moment/moment-with-locales.min.js" type="text/javascript"></script>
		<script src="//<?=$intranetPath?>/assets/custom/custom.js" type="text/javascript"></script>

<?php   loadAngularCore(); ?>

		<script src="//<?=$intranetPath?>/assets/custom/angular-ui-router/angular-ui-router.min.js" type="text/javascript"></script>

		<script src="//<?=$intranetPath?>/assets/global/plugins/angularjs/plugins/restangular.min.js" type="text/javascript"></script>

		<script type='text/javascript' src='//cdnjs.cloudflare.com/ajax/libs/angular-loading-bar/0.9.0/loading-bar.min.js'></script>

		<script type='text/javascript' src='//<?php echo $intranetPath; ?>/app/common/common.constants.js'></script>
		<script src="/assets/angular-ui-notification.min.js"></script>
		<script src="/assets/angular-ocModal.js"></script>

		<script src='//intranet.lagtinget.ax/app/rest/rest.module.js' type='text/javascript'></script>
		<script src='//intranet.lagtinget.ax/app/rest/rest.config.js' type='text/javascript'></script>
		<script src='//intranet.lagtinget.ax/app/rest/rest.service.js' type='text/javascript'></script>

		<script src='//intranet.lagtinget.ax/app/login/login.module.js' type='text/javascript'></script>
		<script src='//intranet.lagtinget.ax/app/login/login.service.js' type='text/javascript'></script>

		<script src='/generic/generic.module.js' type='text/javascript'></script>
		<script src='/generic/generic.constants.js' type='text/javascript'></script>
		<script src='/generic/generic.config.js' type='text/javascript'></script>
		<script src='/generic/generic.run.js' type='text/javascript'></script>
		<script src='/generic/generic.service.js' type='text/javascript'></script>
		<script src='/generic/generic.filter.js' type='text/javascript'></script>

		<script src='/client/client.generic/client.generic.module.js' type='text/javascript'></script>
		<script src='/client/client.generic/client.generic.run.js' type='text/javascript'></script>
		<script src='/client/client.generic/client.generic.service.js' type='text/javascript'></script>

		<script src='/generic/ws/ws.module.js' type='text/javascript'></script>
		<script src='/generic/ws/ws.service.js' type='text/javascript'></script>

		<script src='/client/client.main/main.module.js' type='text/javascript'></script>
		<script src='/client/client.main/main.controller.js' type='text/javascript'></script>
<!--
		<script src='x/client/client.main/left.main.controller.js' type='text/javascript'></script>
		<script src='x/client/client.main/center.main.controller.js' type='text/javascript'></script>
		<script src='x/client/client.main/right.main.controller.js' type='text/javascript'></script>
-->
		<script src='/client/client.topnav/topnav.module.js' type='text/javascript'></script>
		<script src='/client/client.topnav/topnav.controller.js' type='text/javascript'></script>

		<script type="text/javascript">
			angular.element(document.getElementsByTagName('head')).append(angular.element('<base href="' + window.location.pathname + '" />'));
		</script>

		<script src="/client/client.js" type="text/javascript"></script>

	</body>
</html>
